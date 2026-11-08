/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.hyperlambda.tests
{
    /*
     * Coverage for [hyperlambda.verify-slots], with the emphasis on invocations it must reject.
     */
    public class VerifySlotsTests
    {
        const string Missing = "missing.slot";
        const string Placeholder = "{slot}";
        const string NonExistingSlot = "NON-EXISTING-SLOT";
        const string Hyper2Lambda = "hyper2lambda";
        const string InvalidInvocationNode = "invalid-invocation";
        const string VerifySlotsName = "hyperlambda.verify-slots";

        // A single line invocation that is invalid, since the slot requires a value.
        const string InvalidInvocation = Hyper2Lambda;

        /*
         * The slots registered in the test environment, keyed by name. The assemblies the test project
         * references are loaded first, since they are otherwise loaded lazily.
         */
        static readonly Dictionary<string, SlotAttribute> Registered = LoadRegistered();

        /*
         * Every executable position of a slot we can verify, with the slot to verify at [Placeholder].
         * Each is used both with a missing slot, which must be reported, and with an existing slot,
         * which must not.
         */
        static readonly string[] Positions =
        [
            "{slot}",
            ".lambda\n   {slot}",
            "eval\n   {slot}",
            "eval\n   eval\n      eval\n         {slot}",
            "if\n   {slot}\n   .lambda\n      eval",
            "if\n   exists:x:@.a\n   .lambda\n      {slot}",
            "if\n   exists:x:@.a\n   .lambda\n      eval\nelse-if\n   {slot}\n   .lambda\n      eval",
            "if\n   exists:x:@.a\n   .lambda\n      eval\nelse-if\n   exists:x:@.b\n   .lambda\n      {slot}",
            "if\n   exists:x:@.a\n   .lambda\n      eval\nelse\n   {slot}",
            "while\n   {slot}\n   .lambda\n      eval",
            "while\n   exists:x:@.a\n   .lambda\n      {slot}",
            "for-each:x:@.items\n   {slot}",
            "map:x:@.items\n   {slot}",
            "filter:x:@.items\n   {slot}",
            "sort:x:@.items\n   {slot}",
            "add:x:@.dst\n   {slot}",
            "insert-before:x:@.dst\n   {slot}",
            "insert-after:x:@.dst\n   {slot}",
            "include:x:@.dst\n   {slot}",
            "and\n   {slot}",
            "or\n   {slot}",
            "not\n   {slot}",
            "get-first-value\n   {slot}",
            "switch:foo\n   case:foo\n      {slot}",
            "switch:foo\n   case:foo\n      eval\n   default\n      {slot}",
            "try\n   {slot}\n.catch\n   eval",
            "try\n   eval\n.catch\n   {slot}",
            "try\n   eval\n.finally\n   {slot}",
            "strings.concat\n   .:foo\n   {slot}",
            "strings.replace:x:@.text\n   .:a\n   {slot}",
            "if\n   exists:x:@.a\n   .lambda\n      for-each:x:@.items\n         try\n            {slot}\n         .catch\n            eval",
        ];

        /*
         * Nodes that are data and not statements, with the slot to verify at [Placeholder]. Nothing
         * inside them is ever verified, whether or not the slot exists.
         */
        static readonly string[] DataPositions =
        [
            ".foo\n   {slot}",
            ".arguments\n   {slot}",
            "..double\n   {slot}",
            ".lambda2\n   {slot}",
            "eval\n   .data\n      {slot}",
            "add:x:@.dst\n   .\n      {slot}",
            "strings.concat\n   .:foo\n   .bar\n      {slot}",
            "// {slot}",
            "/*\n{slot}\n*/",
        ];

        public static IEnumerable<object[]> PositionData => Positions.Select(x => new object[] { x });

        public static IEnumerable<object[]> DataPositionData => DataPositions.Select(x => new object[] { x });

        public static IEnumerable<object[]> SlotNames => Registered.Keys.OrderBy(x => x).Select(x => new object[] { x });

        public static IEnumerable<object[]> RequiredValueSlotNames => Registered
            .Where(x => x.Value.ValueRequired && !x.Value.ValueOrChildrenRequired)
            .OrderBy(x => x.Key)
            .Select(x => new object[] { x.Key });

        public static IEnumerable<object[]> ValueOrChildrenSlotNames => Registered
            .Where(x => x.Value.ValueOrChildrenRequired)
            .OrderBy(x => x.Key)
            .Select(x => new object[] { x.Key });

        public static IEnumerable<object[]> SignatureSlotNames => Registered
            .Where(x => x.Value.SignatureType != null && !AcceptsAnyChild(x.Value))
            .OrderBy(x => x.Key)
            .Select(x => new object[] { x.Key });

        public static IEnumerable<object[]> NamedChildSlots => Registered
            .Where(x => x.Value.SignatureType != null)
            .OrderBy(x => x.Key)
            .SelectMany(x => DeclaredNamedChildren(x.Value).Select(y => new object[] { x.Key, y }));

        #region [ -- Missing slots -- ]

        [Theory]
        [MemberData(nameof(PositionData))]
        public void MissingSlotIsReportedInEveryExecutablePosition(string template)
        {
            HyperlambdaTests.AssertMissingSlots(template.Replace(Placeholder, Missing), Missing);
        }

        [Theory]
        [MemberData(nameof(PositionData))]
        public void ExistingSlotIsAcceptedInEveryExecutablePosition(string template)
        {
            AssertValid(template.Replace(Placeholder, "eval"));
        }

        [Theory]
        [MemberData(nameof(DataPositionData))]
        public void MissingSlotInsideDataIsIgnored(string template)
        {
            AssertValid(template.Replace(Placeholder, Missing));
        }

        [Theory]
        [InlineData("strings.reverse")]
        [InlineData("strings.concatenate")]
        [InlineData("strings.Concat")]
        [InlineData("strings.concat2")]
        [InlineData("strings.")]
        [InlineData("strings")]
        [InlineData("Eval")]
        [InlineData("EVAL")]
        [InlineData("eval2")]
        [InlineData("evals")]
        [InlineData("get-value2")]
        [InlineData(NonExistingSlot)]
        [InlineData("foo")]
        [InlineData("foo.bar.baz")]
        [InlineData("x-y-z")]
        [InlineData("a1")]
        [InlineData("if2")]
        [InlineData("else-if2")]
        public void NearMissAndMadeUpNamesAreReported(string name)
        {
            HyperlambdaTests.AssertMissingSlots(name, name);
        }

        [Fact]
        public void SlotNamedLikeTheNonExistingSlotInTheUserReportIsReported()
        {
            HyperlambdaTests.AssertMissingSlots($"strings.concat\n   .:foo\n   {NonExistingSlot}", NonExistingSlot);
        }

        [Fact]
        public void MissingSlotIsReportedOnlyOnceNoMatterHowOftenItIsUsed()
        {
            var result = HyperlambdaTests.VerifySlots($"{Missing}\n{Missing}\neval\n   {Missing}\nstrings.concat\n   {Missing}");
            Assert.False(result.Get<bool>());
            Assert.Single(result.Children);
        }

        [Fact]
        public void EachDistinctMissingSlotIsReportedInOrderOfAppearance()
        {
            var result = HyperlambdaTests.VerifySlots("missing.one\neval\n   missing.two\nmissing.three\nif\n   missing.four\n   .lambda\n      missing.two");
            Assert.False(result.Get<bool>());
            Assert.Equal(
                "missing.one,missing.two,missing.three,missing.four",
                string.Join(",", result.Children.Select(x => x.Get<string>())));
        }

        [Fact]
        public void MissingSlotsAndInvalidInvocationsAreReportedTogether()
        {
            var result = HyperlambdaTests.VerifySlots("hyper2lambda\n   bogus:bool:true\nmissing.one\nunwrap:x:@.a\n   bogus:bool:true");
            Assert.False(result.Get<bool>());
            Assert.Single(result.Children, x => x.Name == "");
            Assert.Equal(3, result.Children.Count(x => x.Name == InvalidInvocationNode));
        }

        [Fact]
        public void EveryMissingChildOfAnEvaluatedArgumentIsReported()
        {
            HyperlambdaTests.AssertMissingSlots(@"strings.concat
   missing.one
   .:foo
   missing.two
   strings.concat
      missing.three", "missing.one", "missing.two", "missing.three");
        }

        [Fact]
        public void MissingSlotInEveryBranchOfOneIfChainIsReported()
        {
            HyperlambdaTests.AssertMissingSlots(@"if
   missing.condition
   .lambda
      missing.body
else-if
   missing.other.condition
   .lambda
      missing.other.body
else
   missing.fallback",
                "missing.condition",
                "missing.body",
                "missing.other.condition",
                "missing.other.body",
                "missing.fallback");
        }

        #endregion

        #region [ -- Every registered slot -- ]

        [Fact]
        public void TestEnvironmentRegistersEnoughSlotsToBeMeaningful()
        {
            Assert.True(Registered.Count > 50, $"Only {Registered.Count} slots registered");
        }

        [Theory]
        [MemberData(nameof(SlotNames))]
        public void NoRegisteredSlotIsEverReportedAsMissing(string name)
        {
            var result = HyperlambdaTests.VerifySlots(name);
            Assert.DoesNotContain(result.Children, x => x.Name == "");
        }

        [Theory]
        [MemberData(nameof(RequiredValueSlotNames))]
        public void SlotRequiringAValueIsRejectedWithoutOne(string name)
        {
            HyperlambdaTests.AssertInvalidInvocation(
                HyperlambdaTests.VerifySlots(name),
                name,
                "requires a primary (RHS) value",
                CountExpected(name));
        }

        [Theory]
        [MemberData(nameof(RequiredValueSlotNames))]
        public void SlotRequiringAValueIsNotRejectedForALackOfOneWhenGivenAnExpression(string name)
        {
            var result = HyperlambdaTests.VerifySlots($"{name}:x:@.a");
            Assert.DoesNotContain(result.Children, x => x.Get<string>().Contains("requires a primary", StringComparison.Ordinal));
        }

        [Theory]
        [MemberData(nameof(ValueOrChildrenSlotNames))]
        public void SlotRequiringAValueOrChildrenIsRejectedWithNeither(string name)
        {
            HyperlambdaTests.AssertInvalidInvocation(
                HyperlambdaTests.VerifySlots(name),
                name,
                "primary (RHS) value or child nodes",
                CountExpected(name));
        }

        [Theory]
        [MemberData(nameof(ValueOrChildrenSlotNames))]
        public void SlotRequiringAValueOrChildrenIsNotRejectedForLackingBothWhenGivenAnExpression(string name)
        {
            var result = HyperlambdaTests.VerifySlots($"{name}:x:@.a");
            Assert.DoesNotContain(result.Children, x => x.Get<string>().Contains("value or child nodes", StringComparison.Ordinal));
        }

        [Theory]
        [MemberData(nameof(SignatureSlotNames))]
        public void ChildNotDeclaredBySignatureIsRejected(string name)
        {
            var result = HyperlambdaTests.VerifySlots($"{name}:x:@.a\n   zz-bogus-child:x");
            Assert.Contains(
                result.Children,
                x => x.Name == InvalidInvocationNode &&
                    x.Get<string>().Contains($"Slot [{name}] does not accept a child argument named [zz-bogus-child]", StringComparison.Ordinal));
        }

        [Theory]
        [MemberData(nameof(NamedChildSlots))]
        public void ChildDeclaredBySignatureIsNotRejected(string name, string child)
        {
            var result = HyperlambdaTests.VerifySlots($"{name}:x:@.a\n   {child}:x");
            Assert.DoesNotContain(
                result.Children,
                x => x.Name == InvalidInvocationNode &&
                    x.Get<string>().Contains($"[{child}]", StringComparison.Ordinal));
        }

        #endregion

        #region [ -- Invalid invocations -- ]

        [Fact]
        public void EveryUndeclaredChildOfOneInvocationIsReported()
        {
            var result = HyperlambdaTests.VerifySlots("hyper2lambda:x:@.a\n   bogus.one:x\n   bogus.two:x\n   comments:bool:true");
            HyperlambdaTests.AssertInvalidInvocation(result, Hyper2Lambda, "[bogus.one]", 2);
            Assert.Contains(result.Children, x => x.Get<string>().Contains("[bogus.two]", StringComparison.Ordinal));
        }

        [Fact]
        public void TheSameInvalidInvocationIsReportedEachTimeItOccurs()
        {
            var result = HyperlambdaTests.VerifySlots("hyper2lambda:x:@.a\n   bogus:x\nhyper2lambda:x:@.a\n   bogus:x");
            Assert.Equal(2, result.Children.Count(x => x.Name == InvalidInvocationNode));
        }

        [Theory]
        [MemberData(nameof(PositionData))]
        public void InvalidInvocationIsReportedInEveryExecutablePosition(string template)
        {
            var result = HyperlambdaTests.VerifySlots(template.Replace(Placeholder, InvalidInvocation));
            Assert.False(result.Get<bool>());
            Assert.Contains(
                result.Children,
                x => x.Name == InvalidInvocationNode && x.Get<string>().Contains(Hyper2Lambda, StringComparison.Ordinal));
        }

        [Theory]
        [MemberData(nameof(DataPositionData))]
        public void InvalidInvocationInsideDataIsIgnored(string template)
        {
            AssertValid(template.Replace(Placeholder, InvalidInvocation));
        }

        [Fact]
        public void InvalidInvocationMessageNamesSlotAndChild()
        {
            var result = HyperlambdaTests.VerifySlots("hyper2lambda:x:@.a\n   bogus:bool:true");
            Assert.Equal(
                "Slot [hyper2lambda] does not accept a child argument named [bogus]",
                result.Children.Single().Get<string>());
        }

        #endregion

        #region [ -- Input and result -- ]

        [Theory]
        [InlineData("")]
        [InlineData("\n")]
        [InlineData("   \n   ")]
        [InlineData("// just a comment")]
        [InlineData("/*\nblock comment\n*/")]
        public void NothingToVerifyIsValid(string hyperlambda)
        {
            AssertValid(hyperlambda);
        }

        [Fact]
        public void NoValueAndNoChildrenIsValid()
        {
            var node = new Node("", null);
            Common.GetSignaler().Signal(VerifySlotsName, node);
            Assert.True(node.Get<bool>());
            Assert.Empty(node.Children);
        }

        [Theory]
        [InlineData("foo\n      bar")]
        [InlineData("foo\n bar")]
        [InlineData("foo:\"unterminated")]
        public void MalformedHyperlambdaThrowsInsteadOfBeingVerified(string hyperlambda)
        {
            Assert.ThrowsAny<Exception>(() => HyperlambdaTests.VerifySlots(hyperlambda));
        }

        [Fact]
        public void ParsedLambdaChildrenAreVerifiedWhenThereIsNoValue()
        {
            var lambda = new Node("", null);
            lambda.Add(new Node("eval"));
            lambda.Add(new Node(Missing));
            Common.GetSignaler().Signal(VerifySlotsName, lambda);
            Assert.False(lambda.Get<bool>());
            Assert.Equal(Missing, lambda.Children.Single().Get<string>());
        }

        [Fact]
        public void ParsedLambdaChildrenAreVerifiedRecursively()
        {
            var eval = new Node("eval");
            eval.Add(new Node(Missing));
            var lambda = new Node("", null);
            lambda.Add(eval);
            Common.GetSignaler().Signal(VerifySlotsName, lambda);
            Assert.False(lambda.Get<bool>());
            Assert.Equal(Missing, lambda.Children.Single().Get<string>());
        }

        [Fact]
        public void ValidParsedLambdaIsAccepted()
        {
            var lambda = new Node("", null);
            lambda.Add(new Node("eval"));
            Common.GetSignaler().Signal(VerifySlotsName, lambda);
            Assert.True(lambda.Get<bool>());
            Assert.Empty(lambda.Children);
        }

        [Fact]
        public void AnonymousChildOfEvaluatedArgumentIsAccepted()
        {
            var concat = new Node("strings.concat");
            concat.Add(new Node("", "foo"));
            var lambda = new Node("", null);
            lambda.Add(concat);
            Common.GetSignaler().Signal(VerifySlotsName, lambda);
            Assert.True(lambda.Get<bool>());
        }

        [Fact]
        public void ExecutedFromHyperlambdaReportsMissingSlot()
        {
            var lambda = Common.Evaluate($@".code:@""strings.concat
   .:foo
   {NonExistingSlot}""
{VerifySlotsName}:x:@.code");
            var result = lambda.Children.Skip(1).First();
            Assert.False(result.Get<bool>());
            Assert.Equal(NonExistingSlot, result.Children.Single().Get<string>());
        }

        [Fact]
        public void ExecutedFromHyperlambdaAcceptsValidCode()
        {
            var lambda = Common.Evaluate(@".code:@""strings.concat
   .:foo
   get-value:x:@.bar""
hyperlambda.verify-slots:x:@.code");
            var result = lambda.Children.Skip(1).First();
            Assert.True(result.Get<bool>());
            Assert.Empty(result.Children);
        }

        [Fact]
        public void VerifyingNeverExecutesTheCode()
        {
            AssertValid("throw:should-not-run\neval\n   throw:neither-should-this");
        }

        [Fact]
        public void ResultOfValidCodeIsTrueWithoutChildren()
        {
            var result = HyperlambdaTests.VerifySlots("eval");
            Assert.True(result.Get<bool>());
            Assert.Empty(result.Children);
        }

        [Fact]
        public void ResultOfInvalidCodeIsFalseWithDiagnosticChildren()
        {
            var result = HyperlambdaTests.VerifySlots(Missing);
            Assert.False(result.Get<bool>());
            Assert.NotEmpty(result.Children);
        }

        [Fact]
        public void ManyStatementsAreVerified()
        {
            var many = string.Join("\n", Enumerable.Range(0, 500).Select(x => "eval"));
            AssertValid(many);
            HyperlambdaTests.AssertMissingSlots(many + "\n" + Missing, Missing);
        }

        #endregion

        #region [ -- Evaluated arguments -- ]

        [Theory]
        [InlineData("strings.concat")]
        [InlineData("strings.contains")]
        [InlineData("strings.ends-with")]
        [InlineData("strings.join")]
        [InlineData("strings.matches")]
        [InlineData("strings.regex-replace")]
        [InlineData("strings.replace")]
        [InlineData("strings.replace-not-of")]
        [InlineData("strings.split")]
        [InlineData("strings.starts-with")]
        [InlineData("strings.substring")]
        [InlineData("strings.trim")]
        public void EvaluatedArgumentsAreVerifiedWhateverTheirPosition(string slot)
        {
            HyperlambdaTests.AssertMissingSlots($"{slot}:x:@.a\n   .:foo\n   {Missing}", Missing);
            HyperlambdaTests.AssertMissingSlots($"{slot}:x:@.a\n   {Missing}\n   .:foo", Missing);
            HyperlambdaTests.AssertMissingSlots($"{slot}:x:@.a\n   {Missing}\n   {Missing}", Missing);
            AssertValid($"{slot}:x:@.a\n   .:foo\n   get-value:x:@.b");
            AssertValid($"{slot}:x:@.a\n   .:foo\n   .bar:baz");
        }

        [Fact]
        public void EvaluatedArgumentsOfNestedInvocationsAreVerified()
        {
            HyperlambdaTests.AssertMissingSlots(@"strings.concat
   strings.replace:x:@.a
      .:a
      strings.concat
         .:b
         missing.deep", "missing.deep");
        }

        [Fact]
        public void EvaluatedArgumentOfSlotInsideBodyIsVerified()
        {
            HyperlambdaTests.AssertMissingSlots(@"for-each:x:@.items
   strings.concat
      .:foo
      missing.in.loop", "missing.in.loop");
        }

        [Fact]
        public void EvaluatedArgumentWithoutChildrenIsAccepted()
        {
            AssertValid("strings.concat:x:@.a");
        }

        #endregion

        #region [ -- Private helpers -- ]

        static void AssertValid(string hyperlambda)
        {
            var result = HyperlambdaTests.VerifySlots(hyperlambda);
            Assert.True(result.Get<bool>(), string.Join(", ", result.Children.Select(x => x.Get<string>())));
            Assert.Empty(result.Children);
        }

        /*
         * Number of diagnostics expected for an invocation of the slot with neither value nor children;
         * every such diagnostic is about the slot itself.
         */
        static int CountExpected(string name)
        {
            return HyperlambdaTests.VerifySlots(name).Children.Count();
        }

        static Dictionary<string, SlotAttribute> LoadRegistered()
        {
            foreach (var reference in typeof(VerifySlotsTests).Assembly.GetReferencedAssemblies()
                .Where(x => x.Name.StartsWith("magic.", StringComparison.Ordinal)))
            {
                Assembly.Load(reference);
            }
            return AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(x => x.GetTypes())
                .SelectMany(x => x.GetCustomAttributes<SlotAttribute>(false))
                .GroupBy(x => x.Name)
                .ToDictionary(x => x.Key, x => x.First());
        }

        /*
         * Whether the signature accepts any child at all, which it does when it declares a "*" child,
         * or an executable "." argument.
         */
        static bool AcceptsAnyChild(SlotAttribute slot)
        {
            return Signature(slot).Children.Any(x =>
                x.Name == "*" || (x.Name == "." && x.Mode == SlotChildMode.ExecutableLambda));
        }

        /*
         * The named children a signature declares, excluding the ones that are bodies or data.
         */
        static IEnumerable<string> DeclaredNamedChildren(SlotAttribute slot)
        {
            return Signature(slot).Children
                .Where(x => !string.IsNullOrEmpty(x.Name) &&
                    x.Name != "*" &&
                    !x.Name.StartsWith('.') &&
                    x.Mode != SlotChildMode.ExecutableLambda)
                .Select(x => x.Name)
                .Distinct();
        }

        static ISlotSignature Signature(SlotAttribute slot)
        {
            return (ISlotSignature)Activator.CreateInstance(slot.SignatureType);
        }

        #endregion
    }
}
