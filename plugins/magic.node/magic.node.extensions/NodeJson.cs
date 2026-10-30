/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Numerics;
using System.Globalization;
using System.Buffers;
using System.Text.Json;
using System.Collections.Generic;

namespace magic.node.extensions
{
    /// <summary>
    /// Converts between lambda objects (Node hierarchies) and JSON, directly, without any intermediate object model.
    ///
    /// Everything written is formatted exactly as Newtonsoft.Json used to format it, which is what Magic's JSON used to be
    /// created with. For instance a double with no fractions is written as 1.0, and a decimal without a fraction as 5.0,
    /// dates are written as ISO 8601 with trailing zeros of the fraction removed, and only the characters that must be
    /// escaped are escaped.
    ///
    /// Reading mirrors how Newtonsoft.Json read JSON into lambda objects; integers become long (or BigInteger if they don't fit),
    /// numbers with a fraction or an exponent become double, and strings that look like ISO 8601 dates become DateTime.
    /// </summary>
    public static class NodeJson
    {
        static readonly JsonReaderOptions _options = new JsonReaderOptions
        {
            AllowTrailingCommas = true,
            CommentHandling = JsonCommentHandling.Skip,
        };

        static readonly JsonReaderOptions _strictOptions = new JsonReaderOptions();

        /*
         * Boxed values shared by everybody, since nodes hold their values as objects, and boxing a value allocates.
         */
        static readonly object _true = true;
        static readonly object _false = false;
        static readonly object[] _smallIntegers = CreateSmallIntegers();

        static object[] CreateSmallIntegers()
        {
            var result = new object[1026];
            for (var idx = 0; idx < result.Length; idx++)
            {
                result[idx] = (long)(idx - 1);
            }
            return result;
        }

        #region [ -- Lambda to JSON -- ]

        /// <summary>
        /// Converts the children of the specified node to JSON.
        ///
        /// If any child has a name, the result is a JSON object, otherwise if there are children it is an array,
        /// and if there are no children it is an empty object.
        /// </summary>
        /// <param name="source">Node whose children should be converted.</param>
        /// <param name="indented">If true, the result is formatted with two spaces of indentation.</param>
        /// <returns>The JSON.</returns>
        public static string ToJson(Node source, bool indented = false)
        {
            var emitter = Emitter.Rent(indented);
            try
            {
                WriteContainer(emitter, source);
                return emitter.ToString();
            }
            finally
            {
                emitter.Return();
            }
        }

        /// <summary>
        /// Converts the children of the specified node to JSON, the way ToJson does, and returns it UTF8 encoded, which is
        /// how it is sent over the wire, without ever creating the string.
        /// </summary>
        /// <param name="source">Node whose children should be converted.</param>
        /// <returns>The JSON, UTF8 encoded.</returns>
        public static byte[] ToUtf8(Node source)
        {
            var emitter = Emitter.Rent(false);
            try
            {
                WriteContainer(emitter, source);
                return emitter.ToUtf8();
            }
            finally
            {
                emitter.Return();
            }
        }

        /// <summary>
        /// Converts the children of the specified node to "simple objects", that is Dictionary&lt;string, object&gt;
        /// for JSON objects, List&lt;object&gt; for arrays, and the value itself for everything else.
        /// </summary>
        /// <param name="source">Node whose children should be converted.</param>
        /// <returns>The simple object.</returns>
        public static object ToObject(Node source)
        {
            var count = source.ChildCount;
            if (HasNamedChild(source))
            {
                var result = new Dictionary<string, object>(count);
                for (var idx = 0; idx < count; idx++)
                {
                    var child = source.ChildAt(idx);
                    if (!result.TryAdd(child.Name, ChildToObject(child)))
                        throw DuplicateName(child.Name);
                }
                return result;
            }
            else if (count > 0)
            {
                var result = new List<object>(count);
                for (var idx = 0; idx < count; idx++)
                {
                    result.Add(ChildToObject(source.ChildAt(idx)));
                }
                return result;
            }
            return new Dictionary<string, object>();
        }

        #endregion

        #region [ -- JSON to lambda -- ]

        /// <summary>
        /// Parses the specified JSON, and adds the result as children of the specified node.
        ///
        /// A JSON object becomes children named after its properties, and a JSON array becomes children named ".".
        /// Notice, a JSON document that is a simple value, and not an object or an array, creates no children.
        /// </summary>
        /// <param name="target">Node to add the result to.</param>
        /// <param name="json">JSON to parse.</param>
        public static void FromJson(Node target, string json)
        {
            if (json == null)
                throw new HyperlambdaException("No JSON given");

            // Small documents are encoded on the stack, larger ones in a pooled buffer, so no array is allocated for them.
            var max = Encoding.UTF8.GetMaxByteCount(json.Length);
            if (max <= 512)
            {
                Span<byte> buffer = stackalloc byte[512];
                FromUtf8(target, buffer.Slice(0, Encoding.UTF8.GetBytes(json, buffer)), true, false);
                return;
            }
            var rented = ArrayPool<byte>.Shared.Rent(max);
            try
            {
                FromUtf8(target, new ReadOnlySpan<byte>(rented, 0, Encoding.UTF8.GetBytes(json, rented)), true, false);
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(rented);
            }
        }

        /// <summary>
        /// Parses the specified UTF8 encoded JSON, and adds the result as children of the specified node.
        /// </summary>
        /// <param name="target">Node to add the result to.</param>
        /// <param name="utf8">JSON to parse.</param>
        /// <param name="rejectTrailing">If true, anything after the JSON value is an error.</param>
        /// <param name="skipBom">If true, a UTF8 byte order mark at the start is ignored.</param>
        /// <param name="strict">If true, comments and trailing commas are errors.</param>
        public static void FromUtf8(Node target, ReadOnlySpan<byte> utf8, bool rejectTrailing, bool skipBom = true, bool strict = false)
        {
            if (skipBom)
                utf8 = SkipBom(utf8);
            try
            {
                var reader = new Utf8JsonReader(utf8, strict ? _strictOptions : _options);
                if (!reader.Read())
                    throw new HyperlambdaException("Invalid JSON, no content");
                if (reader.TokenType == JsonTokenType.StartObject || reader.TokenType == JsonTokenType.StartArray)
                    ReadValue(ref reader, target);
                if (rejectTrailing && reader.Read())
                    throw new HyperlambdaException("Invalid JSON, additional text encountered after finished reading JSON content");
            }
            catch (JsonException error)
            {
                throw new HyperlambdaException("Invalid JSON, " + error.Message);
            }
        }

        /// <summary>
        /// Parses the specified JSON, that must be a JSON object, to a Dictionary&lt;string, object&gt;, with nested
        /// objects as Dictionary&lt;string, object&gt;, and arrays as List&lt;object&gt;.
        /// </summary>
        /// <param name="json">JSON to parse.</param>
        /// <returns>The parsed object.</returns>
        public static Dictionary<string, object> ParseObject(string json)
        {
            return ParseObjectBytes(Encoding.UTF8.GetBytes(json ?? throw new HyperlambdaException("No JSON given")));
        }

        static Dictionary<string, object> ParseObjectBytes(byte[] bytes)
        {
            try
            {
                var reader = new Utf8JsonReader(bytes, _options);
                if (!reader.Read() || reader.TokenType != JsonTokenType.StartObject)
                    throw new HyperlambdaException("Invalid JSON, the JSON is not a JSON object");
                var result = (Dictionary<string, object>)ReadObject(ref reader);
                if (reader.Read())
                    throw new HyperlambdaException("Invalid JSON, additional text encountered after finished reading JSON content");
                return result;
            }
            catch (JsonException error)
            {
                throw new HyperlambdaException("Invalid JSON, " + error.Message);
            }
        }

        /// <summary>
        /// Parses the specified JSON, that must be a JSON object, and creates JSON from it again, formatted with indentation.
        ///
        /// Useful to validate JSON, and format it in a consistent way.
        /// </summary>
        /// <param name="json">JSON to reformat.</param>
        /// <returns>The JSON, formatted.</returns>
        public static string Reformat(string json)
        {
            var bytes = Encoding.UTF8.GetBytes(json ?? throw new HyperlambdaException("No JSON given"));
            var parsed = ParseObjectBytes(bytes);
            var emitter = Emitter.Rent(true);
            try
            {
                Emit(emitter, parsed);
                return emitter.ToString();
            }
            finally
            {
                emitter.Return();
            }
        }

        #endregion

        #region [ -- Private helper methods, writing -- ]

        static ReadOnlySpan<byte> SkipBom(ReadOnlySpan<byte> utf8)
        {
            if (utf8.Length >= 3 && utf8[0] == 0xEF && utf8[1] == 0xBB && utf8[2] == 0xBF)
                return utf8.Slice(3);
            return utf8;
        }

        static bool HasNamedChild(Node node)
        {
            var count = node.ChildCount;
            for (var idx = 0; idx < count; idx++)
            {
                var name = node.ChildAt(idx).Name;
                if (name.Length > 0 && name != ".")
                    return true;
            }
            return false;
        }

        static ArgumentException DuplicateName(string name)
        {
            return new ArgumentException($"Can not add property {name} to JSON object. Property with the same name already exists.");
        }

        static void WriteContainer(Emitter emitter, Node node)
        {
            var count = node.ChildCount;
            if (HasNamedChild(node))
            {
                CheckNoDuplicates(node, count);
                emitter.BeginObject();
                for (var idx = 0; idx < count; idx++)
                {
                    var child = node.ChildAt(idx);
                    emitter.Name(child.Name);
                    WriteChild(emitter, child);
                }
                emitter.EndObject();
            }
            else if (count > 0)
            {
                emitter.BeginArray();
                for (var idx = 0; idx < count; idx++)
                {
                    WriteChild(emitter, node.ChildAt(idx));
                }
                emitter.EndArray();
            }
            else
            {
                emitter.BeginObject();
                emitter.EndObject();
            }
        }

        static void CheckNoDuplicates(Node node, int count)
        {
            if (count < 2)
                return;
            if (count <= 16)
                CheckNoDuplicatesByComparing(node, count);
            else
                CheckNoDuplicatesByHashing(node, count);
        }

        // Cheaper than allocating a hash set for the typical, small, object.
        static void CheckNoDuplicatesByComparing(Node node, int count)
        {
            for (var idx = 1; idx < count; idx++)
            {
                var name = node.ChildAt(idx).Name;
                for (var idxPrev = 0; idxPrev < idx; idxPrev++)
                {
                    if (string.Equals(node.ChildAt(idxPrev).Name, name, StringComparison.Ordinal))
                        throw DuplicateName(name);
                }
            }
        }

        static void CheckNoDuplicatesByHashing(Node node, int count)
        {
            var seen = new HashSet<string>(count, StringComparer.Ordinal);
            for (var idx = 0; idx < count; idx++)
            {
                if (!seen.Add(node.ChildAt(idx).Name))
                    throw DuplicateName(node.ChildAt(idx).Name);
            }
        }

        static void WriteChild(Emitter emitter, Node child)
        {
            if (child.ChildCount > 0)
                WriteContainer(emitter, child);
            else
                WriteValue(emitter, GetValue(child));
        }

        static object ChildToObject(Node child)
        {
            if (child.ChildCount > 0)
                return ToObject(child);
            var value = GetValue(child);
            CheckSupported(value);
            return value;
        }

        /*
         * Returns the value of the specified node, with DateTime values that have no kind given a kind according to configuration.
         */
        static object GetValue(Node node)
        {
            var value = node.GetEx<object>();
            if (value is DateTime date && Converter.DefaultTimeZone != "none" && date.Kind == DateTimeKind.Unspecified)
            {
                if (Converter.DefaultTimeZone == "utc")
                    value = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                else if (Converter.DefaultTimeZone == "local")
                    value = DateTime.SpecifyKind(date, DateTimeKind.Local);
            }
            return value;
        }

        static void CheckSupported(object value)
        {
            switch (value)
            {
                case null:
                case DBNull:
                case string:
                case long:
                case int:
                case short:
                case sbyte:
                case ulong:
                case uint:
                case ushort:
                case byte:
                case Enum:
                case BigInteger:
                case double:
                case float:
                case decimal:
                case DateTime:
                case DateTimeOffset:
                case bool:
                case byte[]:
                case Guid:
                case Uri:
                case TimeSpan:
                    return;
                default:
                    throw new ArgumentException($"Could not determine JSON object type for type {value.GetType()}.");
            }
        }

        static void WriteValue(Emitter emitter, object value)
        {
            switch (value)
            {
                case null:
                case DBNull:
                    emitter.Null();
                    break;
                case string str:
                    emitter.String(str);
                    break;
                case long l:
                    emitter.Long(l);
                    break;
                case int i:
                    emitter.Long(i);
                    break;
                case short s:
                    emitter.Long(s);
                    break;
                case sbyte sb:
                    emitter.Long(sb);
                    break;
                case byte b:
                    emitter.Long(b);
                    break;
                case ushort us:
                    emitter.Long(us);
                    break;
                case uint ui:
                    emitter.Long(ui);
                    break;
                case ulong ul:
                    emitter.ULong(ul);
                    break;
                case Enum en:
                    emitter.Long(Convert.ToInt64(en, CultureInfo.InvariantCulture));
                    break;
                case BigInteger big:
                    emitter.BigInteger(big);
                    break;
                case double d:
                    emitter.Double(d);
                    break;
                case float f:
                    emitter.Float(f);
                    break;
                case decimal m:
                    emitter.Decimal(m);
                    break;
                case DateTime dt:
                    emitter.DateTime(dt);
                    break;
                case DateTimeOffset dto:
                    emitter.DateTimeOffset(dto);
                    break;
                case bool bl:
                    emitter.Bool(bl);
                    break;
                case byte[] bytes:
                    emitter.String(Convert.ToBase64String(bytes));
                    break;
                case Guid g:
                    emitter.String(g.ToString("D", CultureInfo.InvariantCulture));
                    break;
                case Uri uri:
                    emitter.String(uri.OriginalString);
                    break;
                case TimeSpan ts:
                    emitter.String(ts.ToString());
                    break;
                default:
                    throw new ArgumentException($"Could not determine JSON object type for type {value.GetType()}.");
            }
        }

        #endregion

        #region [ -- Private helper methods, reading -- ]

        /*
         * Reads the value the reader is positioned at, which is an object or an array, adding its content to node.
         */
        static void ReadValue(ref Utf8JsonReader reader, Node node)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.StartObject:
                    Dictionary<string, Node> index = null;
                    while (reader.Read() && reader.TokenType == JsonTokenType.PropertyName)
                    {
                        var name = Names.Get(ref reader);
                        reader.Read();
                        var child = FindProperty(node, name, ref index);
                        if (child != null)
                        {
                            // Duplicate property name, the last value replaces the first, which keeps its position.
                            child.Clear();
                            child.Value = null;
                        }
                        else
                        {
                            child = new Node(name);
                            node.Add(child);
                            index?.Add(name, child);
                        }
                        ReadValue(ref reader, child);
                    }
                    break;

                case JsonTokenType.StartArray:
                    while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
                    {
                        var child = new Node(".");
                        node.Add(child);
                        ReadValue(ref reader, child);
                    }
                    break;

                case JsonTokenType.String:
                    node.Value = StringValue(reader.GetString(), true);
                    break;

                case JsonTokenType.Number:
                    node.Value = NumberValue(ref reader);
                    break;

                case JsonTokenType.True:
                    node.Value = _true;
                    break;

                case JsonTokenType.False:
                    node.Value = _false;
                    break;

                default:
                    node.Value = null;
                    break;
            }
        }

        static Node FindProperty(Node node, string name, ref Dictionary<string, Node> index)
        {
            var count = node.ChildCount;
            if (index == null && count > 8)
            {
                index = new Dictionary<string, Node>(count * 2, StringComparer.Ordinal);
                for (var idx = 0; idx < count; idx++)
                {
                    index.TryAdd(node.ChildAt(idx).Name, node.ChildAt(idx));
                }
            }
            if (index != null)
                return index.TryGetValue(name, out var found) ? found : null;
            for (var idx = 0; idx < count; idx++)
            {
                var child = node.ChildAt(idx);
                if (string.Equals(child.Name, name, StringComparison.Ordinal))
                    return child;
            }
            return null;
        }

        /*
         * Reads the value the reader is positioned at into simple objects.
         */
        static object ReadObject(ref Utf8JsonReader reader)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.StartObject:
                    var dictionary = new Dictionary<string, object>();
                    while (reader.Read() && reader.TokenType == JsonTokenType.PropertyName)
                    {
                        var name = Names.Get(ref reader);
                        reader.Read();
                        dictionary[name] = ReadObject(ref reader);
                    }
                    return dictionary;

                case JsonTokenType.StartArray:
                    var list = new List<object>();
                    while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
                    {
                        list.Add(ReadObject(ref reader));
                    }
                    return list;

                case JsonTokenType.String:
                    return StringValue(reader.GetString(), false);

                case JsonTokenType.Number:
                    return NumberValue(ref reader);

                case JsonTokenType.True:
                    return _true;

                case JsonTokenType.False:
                    return _false;

                default:
                    return null;
            }
        }

        /*
         * Writes simple objects, as created by ReadObject, to the emitter.
         */
        static void Emit(Emitter emitter, object value)
        {
            switch (value)
            {
                case Dictionary<string, object> dictionary:
                    emitter.BeginObject();
                    foreach (var idx in dictionary)
                    {
                        emitter.Name(idx.Key);
                        Emit(emitter, idx.Value);
                    }
                    emitter.EndObject();
                    break;

                case List<object> list:
                    emitter.BeginArray();
                    foreach (var idx in list)
                    {
                        Emit(emitter, idx);
                    }
                    emitter.EndArray();
                    break;

                default:
                    WriteValue(emitter, value);
                    break;
            }
        }

        static object NumberValue(ref Utf8JsonReader reader)
        {
            var span = reader.ValueSpan;
            if (span.IndexOfAny((byte)'.', (byte)'e', (byte)'E') < 0)
            {
                if (reader.TryGetInt64(out var integer))
                    return integer >= -1 && integer <= 1024 ? _smallIntegers[integer + 1] : integer;
                return BigInteger.Parse(Encoding.ASCII.GetString(span), NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture);
            }
            if (reader.TryGetDouble(out var result))
                return result;
            return double.Parse(Encoding.ASCII.GetString(span), NumberStyles.Float, CultureInfo.InvariantCulture);
        }

        /*
         * A string is a DateTime if it is formatted as an ISO 8601 date, with both a date and a time.
         */
        static object StringValue(string value, bool applyTimeZone)
        {
            if (value.Length >= 19 && value.Length <= 40 && char.IsDigit(value[0]) && value[10] == 'T' && TryParseDate(value, out var date))
            {
                if (applyTimeZone && Converter.DefaultTimeZone != "none" && date.Kind == DateTimeKind.Unspecified)
                {
                    if (Converter.DefaultTimeZone == "utc")
                        date = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                    else if (Converter.DefaultTimeZone == "local")
                        date = DateTime.SpecifyKind(date, DateTimeKind.Local);
                }
                return date;
            }
            return value;
        }

        static bool Digits(string s, int start, int length, out int result)
        {
            result = 0;
            if (start + length > s.Length)
                return false;
            for (var idx = start; idx < start + length; idx++)
            {
                var c = s[idx];
                if (c < '0' || c > '9')
                    return false;
                result = result * 10 + (c - '0');
            }
            return true;
        }

        /*
         * Parses yyyy-MM-ddTHH:mm:ss, optionally followed by a fraction, and optionally followed by Z or an offset.
         * Dates with an offset are converted to local time, dates with Z are UTC, and the rest has no kind.
         */
        static bool TryParseDate(string s, out DateTime result)
        {
            result = default;
            if (!TryParseDateAndTime(s, out var date, out var pos))
                return false;
            if (pos == s.Length)
            {
                result = date;
                return true;
            }
            if (s[pos] == 'Z' && pos + 1 == s.Length)
            {
                result = new DateTime(date.Ticks, DateTimeKind.Utc);
                return true;
            }
            return TryApplyOffset(s, pos, date, out result);
        }

        /*
         * Parses yyyy-MM-ddTHH:mm:ss and an optional fraction, and returns the position following them.
         */
        static bool TryParseDateAndTime(string s, out DateTime date, out int pos)
        {
            date = default;
            pos = 19;
            if (!Digits(s, 0, 4, out var year) || s[4] != '-' ||
                !Digits(s, 5, 2, out var month) || s[7] != '-' ||
                !Digits(s, 8, 2, out var day) || s[10] != 'T' ||
                !Digits(s, 11, 2, out var hour) || s[13] != ':' ||
                !Digits(s, 14, 2, out var minute) || s[16] != ':' ||
                !Digits(s, 17, 2, out var second))
                return false;
            if (year < 1 || month < 1 || month > 12 || day < 1 || day > DateTime.DaysInMonth(year, month) || hour > 24 || minute > 59 || second > 59)
                return false;
            if (!TryParseFraction(s, ref pos, out var fraction))
                return false;

            // Hour 24 is only legal as midnight at the end of the day.
            if (hour == 24 && (minute != 0 || second != 0 || fraction != 0))
                return false;
            date = new DateTime(year, month, day, hour == 24 ? 0 : hour, minute, second, DateTimeKind.Unspecified).AddTicks(fraction);
            if (hour == 24)
                date = date.AddDays(1);
            return true;
        }

        /*
         * Parses an optional fraction of a second, returned as ticks, and moves the position past it.
         */
        static bool TryParseFraction(string s, ref int pos, out long fraction)
        {
            fraction = 0;
            if (pos >= s.Length || s[pos] != '.')
                return true;

            pos++;
            var start = pos;
            var digits = 0;
            while (pos < s.Length && s[pos] >= '0' && s[pos] <= '9')
            {
                if (digits == 7)
                    return false;
                fraction = fraction * 10 + (s[pos] - '0');
                digits++;
                pos++;
            }
            if (pos == start)
                return false;
            while (digits++ < 7)
            {
                fraction *= 10;
            }
            return true;
        }

        /*
         * Parses an offset such as +02:00, +0200 or +02 at the specified position, which must end the string, and
         * converts the date to local time.
         */
        static bool TryApplyOffset(string s, int pos, DateTime date, out DateTime result)
        {
            result = default;
            if (s[pos] != '+' && s[pos] != '-')
                return false;
            var west = s[pos] == '-';
            if (!Digits(s, pos + 1, 2, out var zoneHour))
                return false;
            var zoneMinute = 0;
            pos += 3;
            if (pos < s.Length)
            {
                if (s[pos] == ':')
                    pos++;
                if (!Digits(s, pos, 2, out zoneMinute))
                    return false;
                pos += 2;
            }
            if (pos != s.Length || zoneHour > 23 || zoneMinute > 59)
                return false;
            var offset = new TimeSpan(zoneHour, zoneMinute, 0).Ticks;
            var ticks = west ? date.Ticks + offset : date.Ticks - offset;
            if (ticks < DateTime.MinValue.Ticks || ticks > DateTime.MaxValue.Ticks)
                return false;
            result = new DateTime(ticks, DateTimeKind.Utc).ToLocalTime();
            return true;
        }

        #endregion

        #region [ -- Property names -- ]

        /*
         * Remembers the property names it has seen, so a document that repeats its names, such as a list of objects, creates
         * one string for each name, instead of one string for each time it is used. One per thread, and it forgets
         * everything when it has seen too many names, since nobody should be able to fill it.
         */
        sealed class Names
        {
            [ThreadStatic]
            static Names _shared;

            readonly Dictionary<string, string> _names = new Dictionary<string, string>(StringComparer.Ordinal);
            readonly Dictionary<string, string>.AlternateLookup<ReadOnlySpan<char>> _lookup;

            Names()
            {
                _lookup = _names.GetAlternateLookup<ReadOnlySpan<char>>();
            }

            public static string Get(ref Utf8JsonReader reader)
            {
                if (reader.ValueIsEscaped || reader.ValueSpan.Length > 64)
                    return reader.GetString();
                return (_shared ??= new Names()).Intern(reader.ValueSpan);
            }

            string Intern(ReadOnlySpan<byte> utf8)
            {
                Span<char> buffer = stackalloc char[64];
                var key = buffer.Slice(0, Encoding.UTF8.GetChars(utf8, buffer));
                if (_lookup.TryGetValue(key, out var found))
                    return found;
                if (_names.Count >= 512)
                    _names.Clear();
                var result = new string(key);
                _names[result] = result;
                return result;
            }
        }

        #endregion

        #region [ -- The JSON writer -- ]

        /*
         * Writes JSON the way Newtonsoft.Json did. Notice, an instance is reused by the thread that created it.
         */
        sealed class Emitter
        {
            [ThreadStatic]
            static Emitter _cached;

            readonly StringBuilder _builder = new StringBuilder(512);
            readonly List<bool> _hasItems = new List<bool>();
            bool _indented;
            bool _afterName;

            public static Emitter Rent(bool indented)
            {
                var result = _cached ?? new Emitter();
                _cached = null;
                result._indented = indented;
                return result;
            }

            public void Return()
            {
                _builder.Clear();
                _hasItems.Clear();
                _afterName = false;
                if (_builder.Capacity <= 1 << 20)
                    _cached = this;
            }

            public override string ToString()
            {
                return _builder.ToString();
            }

            /*
             * Returns what has been written UTF8 encoded, without creating a string first.
             */
            public byte[] ToUtf8()
            {
                var rented = ArrayPool<byte>.Shared.Rent(Encoding.UTF8.GetMaxByteCount(_builder.Length));
                try
                {
                    // An encoder, since a surrogate pair can be split across two chunks.
                    var encoder = Encoding.UTF8.GetEncoder();
                    var length = 0;
                    foreach (var chunk in _builder.GetChunks())
                    {
                        length += encoder.GetBytes(chunk.Span, rented.AsSpan(length), false);
                    }
                    length += encoder.GetBytes(ReadOnlySpan<char>.Empty, rented.AsSpan(length), true);
                    return rented.AsSpan(0, length).ToArray();
                }
                finally
                {
                    ArrayPool<byte>.Shared.Return(rented);
                }
            }

            public void BeginObject()
            {
                BeforeValue();
                _builder.Append('{');
                _hasItems.Add(false);
            }

            public void EndObject()
            {
                End('}');
            }

            public void BeginArray()
            {
                BeforeValue();
                _builder.Append('[');
                _hasItems.Add(false);
            }

            public void EndArray()
            {
                End(']');
            }

            public void Name(string name)
            {
                Separator();
                Quoted(name);
                _builder.Append(_indented ? ": " : ":");
                _afterName = true;
            }

            public void Null()
            {
                BeforeValue();
                _builder.Append("null");
            }

            public void Bool(bool value)
            {
                BeforeValue();
                _builder.Append(value ? "true" : "false");
            }

            public void String(string value)
            {
                BeforeValue();
                Quoted(value);
            }

            public void Long(long value)
            {
                BeforeValue();
                Format(value);
            }

            public void ULong(ulong value)
            {
                BeforeValue();
                Format(value);
            }

            public void BigInteger(BigInteger value)
            {
                BeforeValue();
                _builder.Append(value.ToString(CultureInfo.InvariantCulture));
            }

            public void Double(double value)
            {
                BeforeValue();
                var text = value.ToString("R", CultureInfo.InvariantCulture);
                if (double.IsNaN(value) || double.IsInfinity(value))
                {
                    // Newtonsoft's default, which is to write them as strings.
                    _builder.Append('"').Append(text).Append('"');
                    return;
                }
                _builder.Append(text);
                if (!text.Contains('.') && !text.Contains('E') && !text.Contains('e'))
                    _builder.Append(".0");
            }

            public void Float(float value)
            {
                BeforeValue();
                var text = value.ToString("R", CultureInfo.InvariantCulture);
                if (float.IsNaN(value) || float.IsInfinity(value))
                {
                    _builder.Append('"').Append(text).Append('"');
                    return;
                }
                _builder.Append(text);
                if (!text.Contains('.') && !text.Contains('E') && !text.Contains('e'))
                    _builder.Append(".0");
            }

            public void Decimal(decimal value)
            {
                BeforeValue();
                var text = value.ToString(null, CultureInfo.InvariantCulture);
                _builder.Append(text);
                if (!text.Contains('.'))
                    _builder.Append(".0");
            }

            public void DateTime(DateTime value)
            {
                BeforeValue();
                _builder.Append('"');
                Date(value, value.Kind == DateTimeKind.Local ? TimeZoneInfo.Local.GetUtcOffset(value) : (TimeSpan?)null, value.Kind == DateTimeKind.Utc);
                _builder.Append('"');
            }

            public void DateTimeOffset(DateTimeOffset value)
            {
                BeforeValue();
                _builder.Append('"');
                Date(value.DateTime, value.Offset, false);
                _builder.Append('"');
            }

            #region [ -- Private helper methods -- ]

            void Separator()
            {
                if (_hasItems.Count == 0)
                    return;
                var last = _hasItems.Count - 1;
                if (_hasItems[last])
                    _builder.Append(',');
                else
                    _hasItems[last] = true;
                if (_indented)
                    NewLine(_hasItems.Count);
            }

            void BeforeValue()
            {
                if (_afterName)
                    _afterName = false;
                else
                    Separator();
            }

            void End(char close)
            {
                var last = _hasItems.Count - 1;
                var had = _hasItems[last];
                _hasItems.RemoveAt(last);
                if (_indented && had)
                    NewLine(_hasItems.Count);
                _builder.Append(close);
            }

            void NewLine(int depth)
            {
                _builder.Append(Environment.NewLine);
                _builder.Append(' ', depth * 2);
            }

            void Format(long value)
            {
                Span<char> buffer = stackalloc char[24];
                value.TryFormat(buffer, out var written, default, CultureInfo.InvariantCulture);
                _builder.Append(buffer.Slice(0, written));
            }

            void Format(ulong value)
            {
                Span<char> buffer = stackalloc char[24];
                value.TryFormat(buffer, out var written, default, CultureInfo.InvariantCulture);
                _builder.Append(buffer.Slice(0, written));
            }

            void Two(int value)
            {
                _builder.Append((char)('0' + value / 10)).Append((char)('0' + value % 10));
            }

            /*
             * Writes yyyy-MM-ddTHH:mm:ss, with a fraction of up to 7 digits if there is any, and then either Z, or an offset.
             */
            void Date(DateTime value, TimeSpan? offset, bool utc)
            {
                Span<char> buffer = stackalloc char[8];
                value.Year.TryFormat(buffer, out var written, "D4", CultureInfo.InvariantCulture);
                _builder.Append(buffer.Slice(0, written)).Append('-');
                Two(value.Month);
                _builder.Append('-');
                Two(value.Day);
                _builder.Append('T');
                Two(value.Hour);
                _builder.Append(':');
                Two(value.Minute);
                _builder.Append(':');
                Two(value.Second);

                var fraction = (int)(value.Ticks % TimeSpan.TicksPerSecond);
                if (fraction != 0)
                {
                    var digits = 7;
                    while (fraction % 10 == 0)
                    {
                        fraction /= 10;
                        digits--;
                    }
                    _builder.Append('.');
                    fraction.TryFormat(buffer, out written, "D" + digits, CultureInfo.InvariantCulture);
                    _builder.Append(buffer.Slice(0, written));
                }

                if (utc)
                {
                    _builder.Append('Z');
                }
                else if (offset.HasValue)
                {
                    var span = offset.Value;
                    _builder.Append(span.Ticks >= 0 ? '+' : '-');
                    Two(Math.Abs(span.Hours));
                    _builder.Append(':');
                    Two(Math.Abs(span.Minutes));
                }
            }

            /*
             * Writes a string literal, only escaping what must be escaped.
             */
            void Quoted(string value)
            {
                _builder.Append('"');
                var start = 0;
                for (var idx = 0; idx < value.Length; idx++)
                {
                    var c = value[idx];
                    if (c >= ' ' && c != '"' && c != '\\' && c != '\u0085' && c != '\u2028' && c != '\u2029')
                        continue;
                    if (idx > start)
                        _builder.Append(value, start, idx - start);
                    start = idx + 1;
                    switch (c)
                    {
                        case '\t':
                            _builder.Append("\\t");
                            break;
                        case '\n':
                            _builder.Append("\\n");
                            break;
                        case '\r':
                            _builder.Append("\\r");
                            break;
                        case '\f':
                            _builder.Append("\\f");
                            break;
                        case '\b':
                            _builder.Append("\\b");
                            break;
                        case '\\':
                            _builder.Append("\\\\");
                            break;
                        case '"':
                            _builder.Append("\\\"");
                            break;
                        default:
                            _builder.Append("\\u").Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                            break;
                    }
                }
                if (start < value.Length)
                    _builder.Append(value, start, value.Length - start);
                _builder.Append('"');
            }

            #endregion
        }

        #endregion
    }
}
