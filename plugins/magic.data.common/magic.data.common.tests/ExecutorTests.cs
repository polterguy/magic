/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.data.common.contracts;
using magic.data.common.helpers;

namespace magic.data.common.tests
{
    public class ExecutorTests
    {
        #region [ -- Fakes -- ]

        class Settings : IDataSettings
        {
            public string DefaultDatabaseType => "sqlite";

            public string ConnectionString(string name, string databaseType = null)
            {
                return name == "generic" ?
                    "Data Source=files/data/{database}.db" :
                    "Server=" + name + ";Database={database}";
            }
        }

        class FakeCommand : DbCommand
        {
            readonly FakeParameters _parameters = new FakeParameters();
            public bool Cancelled { get; private set; }
            public override string CommandText { get; set; }
            public override int CommandTimeout { get; set; }
            public override CommandType CommandType { get; set; }
            public override bool DesignTimeVisible { get; set; }
            public override UpdateRowSource UpdatedRowSource { get; set; }
            protected override DbConnection DbConnection { get; set; }
            protected override DbParameterCollection DbParameterCollection => _parameters;
            protected override DbTransaction DbTransaction { get; set; }
            public IEnumerable<(string Name, object Value)> ParameterValues =>
                _parameters.Items.Select(x => (x.ParameterName, x.Value));
            public override void Cancel() { Cancelled = true; }
            public override int ExecuteNonQuery() => 0;
            public override object ExecuteScalar() => null;
            public override void Prepare() { }
            protected override DbParameter CreateDbParameter() => new FakeParameter();
            protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) => throw new NotSupportedException();
        }

        class FakeParameter : DbParameter
        {
            public override DbType DbType { get; set; }
            public override ParameterDirection Direction { get; set; }
            public override bool IsNullable { get; set; }
            public override string ParameterName { get; set; }
            public override int Size { get; set; }
            public override string SourceColumn { get; set; }
            public override bool SourceColumnNullMapping { get; set; }
            public override object Value { get; set; }
            public override void ResetDbType() { }
        }

        class FakeParameters : DbParameterCollection
        {
            public List<FakeParameter> Items { get; } = new List<FakeParameter>();
            public override int Count => Items.Count;
            public override object SyncRoot => this;
            public override int Add(object value) { Items.Add((FakeParameter)value); return Items.Count - 1; }
            public override void AddRange(Array values) { foreach (var x in values) Add(x); }
            public override void Clear() => Items.Clear();
            public override bool Contains(object value) => Items.Contains((FakeParameter)value);
            public override bool Contains(string value) => Items.Any(x => x.ParameterName == value);
            public override void CopyTo(Array array, int index) => throw new NotSupportedException();
            public override System.Collections.IEnumerator GetEnumerator() => Items.GetEnumerator();
            public override int IndexOf(object value) => Items.IndexOf((FakeParameter)value);
            public override int IndexOf(string parameterName) => Items.FindIndex(x => x.ParameterName == parameterName);
            public override void Insert(int index, object value) => Items.Insert(index, (FakeParameter)value);
            public override void Remove(object value) => Items.Remove((FakeParameter)value);
            public override void RemoveAt(int index) => Items.RemoveAt(index);
            public override void RemoveAt(string parameterName) => Items.RemoveAt(IndexOf(parameterName));
            protected override DbParameter GetParameter(int index) => Items[index];
            protected override DbParameter GetParameter(string parameterName) => Items[IndexOf(parameterName)];
            protected override void SetParameter(int index, DbParameter value) => Items[index] = (FakeParameter)value;
            protected override void SetParameter(string parameterName, DbParameter value) => Items[IndexOf(parameterName)] = (FakeParameter)value;
        }

        class FakeConnection : DbConnection
        {
            public FakeCommand Command { get; } = new FakeCommand();
            public override string ConnectionString { get; set; }
            public override string Database => "fake";
            public override string DataSource => "fake";
            public override string ServerVersion => "1";
            public override ConnectionState State => ConnectionState.Open;
            public override void ChangeDatabase(string databaseName) { }
            public override void Close() { }
            public override void Open() { }
            protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel) => throw new NotSupportedException();
            protected override DbCommand CreateDbCommand() => Command;
        }

        static IRootResolver Resolver()
        {
            var mock = new Mock<IRootResolver>();
            mock.SetupGet(x => x.DynamicFiles).Returns("/dynamic/");
            return mock.Object;
        }

        static string ConnectionString(string value, string type = "sqlite", bool sandboxed = false)
        {
            var signaler = Common.Initialize();
            var node = new Node("", value);
            string result = null;
            if (sandboxed)
                signaler.Scope("whitelist", new List<Node>(), () => result = Executor.GetConnectionString(signaler, Resolver(), node, type, "magic", new Settings()));
            else
                result = Executor.GetConnectionString(signaler, Resolver(), node, type, "magic", new Settings());
            return result;
        }

        #endregion

        #region [ -- Connection strings -- ]

        [Fact]
        public void NoValueUsesTheDefaultCatalogue()
        {
            var signaler = Common.Initialize();
            Assert.Equal(
                "Data Source=/dynamic/data/magic.db",
                Executor.GetConnectionString(signaler, Resolver(), new Node(), "sqlite", "magic", new Settings()));
            Assert.Equal(
                "Data Source=files/data/magic.db",
                Executor.GetConnectionString(signaler, Resolver(), new Node(), "mssql", "magic", new Settings()));
        }

        [Fact]
        public void PlainNameFillsTheGenericTemplate()
        {
            Assert.Equal("Data Source=/dynamic/data/crm.db", ConnectionString("crm"));
            Assert.Equal("Data Source=files/data/crm_2-b.db", ConnectionString("crm_2-b", "mssql"));
        }

        [Fact]
        public void BracketedNameFillsTheGenericTemplate()
        {
            Assert.Equal("Data Source=files/data/crm.db", ConnectionString("[crm]", "mssql"));
        }

        [Fact]
        public void BracketedConfigurationAndNameFillsThatTemplate()
        {
            Assert.Equal("Server=main;Database=crm", ConnectionString("[main|crm]", "mssql"));
        }

        [Fact]
        public void BracketedWithTooManySegmentsThrows()
        {
            Assert.Throws<HyperlambdaException>(() => ConnectionString("[a|b|c]"));
        }

        [Theory]
        [InlineData("../etc")]
        [InlineData("a/b")]
        [InlineData("a b")]
        [InlineData("[../etc]")]
        [InlineData("[main|../etc]")]
        public void IllegalDatabaseNamesThrow(string value)
        {
            Assert.Throws<HyperlambdaException>(() => ConnectionString(value, "mssql"));
        }

        [Fact]
        public void RawConnectionStringIsUsedVerbatim()
        {
            Assert.Equal(
                "Server=db;Database=x",
                ConnectionString("Server=db;Database=x", "mssql"));
        }

        [Fact]
        public void RawConnectionStringIsRefusedInSandbox()
        {
            Assert.Throws<HyperlambdaException>(() =>
                ConnectionString("Server=db;Database=x", "mssql", sandboxed: true));
            Assert.Throws<HyperlambdaException>(() =>
                ConnectionString("Data Source=/etc/passwd:x", "sqlite", sandboxed: true));
        }

        [Fact]
        public void NamesStillWorkInSandbox()
        {
            Assert.Equal("Data Source=files/data/crm.db", ConnectionString("crm", "mssql", sandboxed: true));
        }

        #endregion

        #region [ -- Commands -- ]

        [Fact]
        public void ExecuteParametrisesTheCommandAndClearsTheNode()
        {
            var connection = new FakeConnection();
            var input = new Node("", "select * from foo where a = @a");
            input.Add(new Node("@a", 5L));
            input.Add(new Node("@b", null));
            input.Add(new Node("max", 10L));
            long seenMax = 0;
            Executor.Execute(input, connection, null, (cmd, max) => seenMax = max);
            var command = connection.Command;
            Assert.Equal("select * from foo where a = @a", command.CommandText);
            Assert.Equal(300, command.CommandTimeout);
            Assert.Equal(10L, seenMax);
            var parameters = command.ParameterValues.ToList();
            Assert.Equal(3, parameters.Count);
            Assert.Equal(("@a", (object)5L), parameters[0]);
            Assert.Equal(DBNull.Value, parameters[1].Value);
            Assert.Null(input.Value);
            Assert.Empty(input.Children);
        }

        [Fact]
        public void ExecuteDefaultsMaxToMinusOne()
        {
            var connection = new FakeConnection();
            long seenMax = 0;
            Executor.Execute(new Node("", "select 1"), connection, null, (cmd, max) => seenMax = max);
            Assert.Equal(-1L, seenMax);
        }

        [Fact]
        public async Task ExecuteAsyncHandsOverMaxAndRemovesItFromTheParameters()
        {
            var connection = new FakeConnection();
            var input = new Node("", "select 1");
            input.Add(new Node("max", 3L));
            input.Add(new Node("@a", "x"));
            long seenMax = 0;
            await Executor.ExecuteAsync(input, connection, null, (cmd, max) =>
            {
                seenMax = max;
                return Task.CompletedTask;
            });
            Assert.Equal(3L, seenMax);
            var parameters = connection.Command.ParameterValues.ToList();
            Assert.Single(parameters);
            Assert.Equal("@a", parameters[0].Name);
        }

        [Fact]
        public async Task ExecuteAsyncRefusesToStartWhenAlreadyCancelled()
        {
            var connection = new FakeConnection();
            var called = false;
            using var cts = new CancellationTokenSource();
            cts.Cancel();
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                Executor.ExecuteAsync(new Node("", "select 1"), connection, null, (cmd, max) =>
                {
                    called = true;
                    return Task.CompletedTask;
                }, cts.Token));
            Assert.False(called);
        }

        [Fact]
        public async Task ExecuteAsyncCancelsTheCommandWhenCancelledMidFlight()
        {
            var connection = new FakeConnection();
            using var cts = new CancellationTokenSource();
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                Executor.ExecuteAsync(new Node("", "select 1"), connection, null, (cmd, max) =>
                {
                    cts.Cancel();
                    return Task.CompletedTask;
                }, cts.Token));
            Assert.True(connection.Command.Cancelled);
        }

        [Fact]
        public async Task ExecuteAsyncWithoutCancellationJustRuns()
        {
            var connection = new FakeConnection();
            var called = false;
            await Executor.ExecuteAsync(new Node("", "select 1"), connection, null, (cmd, max) =>
            {
                called = true;
                return Task.CompletedTask;
            });
            Assert.True(called);
            Assert.False(connection.Command.Cancelled);
        }

        #endregion

        #region [ -- Results -- ]

        static DataTableReader Reader()
        {
            var table = new DataTable();
            table.Columns.Add("id", typeof(int));
            table.Columns.Add("name", typeof(string));
            table.Rows.Add(1, "one");
            table.Rows.Add(2, DBNull.Value);
            table.Rows.Add(3, "three");
            return table.CreateDataReader();
        }

        [Fact]
        public void BuildResultRowAddsOneNodePerRow()
        {
            var parent = new Node();
            using var reader = Reader();
            long max = -1;
            var rows = 0;
            while (reader.Read() && Executor.BuildResultRow(reader, parent, ref max))
            {
                rows++;
            }
            Assert.Equal(3, rows);
            Assert.Equal(3, parent.Children.Count());
            Assert.Equal(new[] { "id", "name" }, parent.Children.First().Children.Select(x => x.Name).ToArray());
            Assert.Equal("one", parent.Children.First().Children.Last().Value);
            Assert.Null(parent.Children.Skip(1).First().Children.Last().Value);
        }

        [Fact]
        public void BuildResultRowStopsAtMax()
        {
            var parent = new Node();
            using var reader = Reader();
            long max = 2;
            while (reader.Read() && Executor.BuildResultRow(reader, parent, ref max))
            {
            }
            Assert.Equal(2, parent.Children.Count());
        }

        [Fact]
        public void BuildResultRowUsesTheConverter()
        {
            var parent = new Node();
            using var reader = Reader();
            reader.Read();
            long max = -1;
            Executor.BuildResultRow(reader, parent, ref max, x => "converted");
            Assert.All(parent.Children.First().Children, x => Assert.Equal("converted", x.Value));
        }

        [Fact]
        public void MultipleResultSetsFlagIsReadAndRemoved()
        {
            var input = new Node();
            input.Add(new Node("multiple-result-sets", true));
            Assert.True(Executor.HasMultipleResultSets(input));
            Assert.Empty(input.Children);
            Assert.False(Executor.HasMultipleResultSets(input));
        }

        #endregion
    }
}
