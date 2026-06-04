/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.data.common.signatures
{
    /// <summary>
    /// Child signature for [sql.create].
    /// </summary>
    public class SqlCreateSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            Table(SlotChildCardinality.ExactlyOne, false),
            Values(),
        };

        internal static SlotChild Table(SlotChildCardinality cardinality, bool readFeatures)
        {
            var result = new SlotChild
            {
                Name = "table",
                Type = "string",
                Kind = "table-name",
                Description = "Table name to use in the SQL statement",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = cardinality,
            };
            if (readFeatures)
            {
                result.Children.Add(new SlotChild
                {
                    Name = "as",
                    Type = "string",
                    Kind = "table-alias",
                    Description = "Optional table alias",
                    Required = false,
                    Mode = SlotChildMode.ValueOrExpression,
                    Cardinality = SlotChildCardinality.ZeroOrOne,
                });
                result.Children.Add(Join(1));
            }
            return result;
        }

        internal static SlotChild Values()
        {
            return new SlotChild
            {
                Name = "values",
                Type = "lambda",
                Description = "Column values to insert or update",
                Required = true,
                Mode = SlotChildMode.DynamicNamedValues,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "object",
                        Kind = "sql-column-value,text,number,boolean,date,guid,content,value",
                        Description = "Column name and value",
                        Required = true,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.OneOrMore,
                        // Column-name → catalog dispatch (date columns →
                        // date catalog, `_id` → integer, `email` → email,
                        // etc.) lives in rules.yaml under `dispatch-rules:`
                        // (target-kind: sql-column-value). Picked up by
                        // Kind at child-emit time.
                        //
                        // Trade-off: with a ValueTemplate effectively set
                        // (via dispatch lookup), expressions (`x:@.someVar`)
                        // aren't wired into these columns — the template
                        // always wins and returns a literal. That's
                        // acceptable: realistic SQL value lists are
                        // predominantly literals, and the corpus's
                        // expression variety comes from many other slots.
                    },
                },
            };
        }

        // `required` (default false) — pass true for UPDATE/DELETE schemas so
        // the corpus never teaches a WHERE-less destructive statement. SELECT
        // /COUNT/SCALAR/READ accept optional WHERE (filter-less queries are
        // legitimate). UPDATE/DELETE without WHERE silently rewrites or
        // destroys every row in the table — a dangerous production
        // anti-pattern the corpus shouldn't model. Runtime still accepts
        // WHERE-less DELETE/UPDATE if hand-authored; this only constrains
        // synth emission.
        internal static SlotChild Where(bool required = false)
        {
            // The SQL builder concatenates top-level boolean groups under
            // [where] with no joiner between them (see SqlWhereBuilder
            // .AppendBooleanLevel) — only ONE [and] OR [or] is valid at the
            // top level, even though deeper nesting freely accepts multiples.
            // Override the recursive BooleanLevel cardinality to ZeroOrOne at
            // the top level and add an ExactlyOneOf constraint so consumers
            // (and the synthesizer) emit a single, well-formed predicate
            // root.
            var and = BooleanLevel("and", 1);
            var or = BooleanLevel("or", 1);
            and.Cardinality = SlotChildCardinality.ZeroOrOne;
            or.Cardinality = SlotChildCardinality.ZeroOrOne;
            return new SlotChild
            {
                Name = "where",
                Type = "lambda",
                Kind = "sql-predicate-root",
                Description = required
                    ? "Required boolean predicate tree — destructive SQL must constrain affected rows"
                    : "Optional boolean predicate tree",
                Required = required,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Children = { and, or },
                Constraints =
                {
                    new SlotConstraint
                    {
                        Kind = SlotConstraintKind.ExactlyOneOf,
                        Description = "Where clause renders one top-level boolean group",
                        Values = { "and", "or" },
                    },
                },
            };
        }

        // BooleanLevel composes AND/OR groups recursively. `conditionFactory`
        // produces the LEAF condition schema — different for WHERE
        // (literal/expression value compare) vs JOIN ON (column-ref compare).
        // Passing the factory keeps the recursion generic; no per-context
        // branching inside BooleanLevel itself.
        //
        // `allowOr` controls whether OR subgroups are emitted at this level
        // and all deeper levels reached through recursion. WHERE clauses use
        // `allowOr=true` (the default) — OR-based filters are common SQL.
        // JOIN ON clauses use `allowOr=false` — every level renders only AND
        // subgroups. OR-based JOIN predicates are syntactically valid SQL but
        // semantically rare and would teach the corpus an anti-pattern; the
        // SQL builder still accepts hand-written `[or]` inside `[on]` for
        // backward compatibility, the schema just refuses to GENERATE it.
        internal static SlotChild BooleanLevel(string name, int depth, Func<SlotChild> conditionFactory = null, bool allowOr = true)
        {
            conditionFactory ??= Condition;
            var result = new SlotChild
            {
                Name = name,
                Type = "lambda",
                Kind = "sql-predicate-group",
                Description = $"Boolean {name.ToUpperInvariant()} group",
                Required = false,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Children =
                {
                    conditionFactory(),
                },
            };
            if (depth > 0)
            {
                result.Children.Add(BooleanLevel("and", depth - 1, conditionFactory, allowOr));
                if (allowOr)
                    result.Children.Add(BooleanLevel("or", depth - 1, conditionFactory, allowOr));
            }
            return result;
        }

        // WHERE condition: LHS is a column-with-operator suffix (id.eq,
        // email.like, …), RHS is a literal value or expression to compare
        // against. The RHS kind list starts with `text,number,...` because
        // the comparison target is data, not another column.
        //
        // The inner `*` value-list child set is ONLY meaningful for the
        // `.in` operator (`status.in` with a list of admissible values).
        // For every other operator (.eq, .gte, .like, …) the predicate is
        // a single-value compare — emitting child nodes produces invalid
        // SQL like `id.gte:5 / extra:foo`. The NamePattern-gated Excludes
        // constraint below forbids the wildcard child schema whenever the
        // condition's resolved name does NOT end in `.in`, so the inner
        // child loop never runs for those cases.
        internal static SlotChild Condition()
        {
            return new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "sql-column-condition,text,number,boolean,date,guid,content,value",
                Description = "Column condition; suffix the name with .eq, .neq, .gt, .gte, .lt, .lte, .like, .ilike, or .in to select an operator",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.OneOrMore,
                // Column-name → catalog dispatch lives in rules.yaml under
                // `dispatch-rules:` (target-kind: sql-column-condition).
                // Same patterns as the sql-column-value ruleset but each
                // pattern tolerates an OPTIONAL operator suffix (`.eq`,
                // `.in`, `.gte`, …) so `created_at.gt` still routes to
                // the date catalog. Picked up by Kind at child-emit time.
                //
                // The nested `[.]` value-list child (for `.in` operators)
                // keeps the broad Kind because its values are anonymous
                // list items, not column-named cells — biasing them by
                // name isn't applicable.
                Children =
                {
                    new SlotChild
                    {
                        // Anonymous list-item child. Name is the literal `.`
                        // so emission renders the canonical `.: <value>` form
                        // the SQL builder serializes as an IN list. Earlier
                        // wildcard `*` made ChildName pick a real identifier
                        // from kind-keyed catalogs (description, title, …),
                        // producing `email.in / description: x:@…` which the
                        // SQL builder reads as a sibling column instead of
                        // an IN list element. Hard-coding `.` is right here
                        // — list items in this shape have no semantic name.
                        Name = ".",
                        Type = "object",
                        Kind = "text,number,boolean,date,guid,content,value",
                        Description = "Value item used by operators such as .in",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        // TwoOrMore — a meaningful IN clause has ≥2 admissible
                        // values. Single-element IN lists are legal SQL but
                        // semantically pointless (use `.eq` for that). The
                        // outer NamePattern Excludes below zeroes this out
                        // for non-.in operators (.eq/.gt/etc.) so single-
                        // value predicates don't accidentally inherit the
                        // ≥2 cardinality.
                        Cardinality = SlotChildCardinality.TwoOrMore,
                    },
                },
                Constraints =
                {
                    new SlotConstraint
                    {
                        Kind = SlotConstraintKind.Excludes,
                        // Fire when the condition name does NOT end in `.in`
                        // (covers all single-value operators: .eq, .neq, .gt,
                        // .gte, .lt, .lte, .like, .ilike, plus bare column
                        // names which default to equality). Excludes the
                        // literal-`.` list-item schema so these operators
                        // render as `column.op: <value>` with no children.
                        NamePattern = "^(?!.*\\.in$).*$",
                        Values = { "." },
                        Description = "Value-list children apply only to the .in operator; other operators take a single-value RHS",
                    },
                    new SlotConstraint
                    {
                        Kind = SlotConstraintKind.Excludes,
                        // Complementary half: fire when the condition name
                        // DOES end in `.in`. Forbid the special sentinel
                        // `input` so BuildNonExecChild suppresses the
                        // outer condition's scalar value — the IN payload
                        // lives in the `.:` children, not on the condition
                        // node itself. Without this, the emitter produces
                        // `email.in: alice@x.test / .: bob@x.test / .:
                        // carol@x.test` which the SQL builder reads as
                        // "first value belongs to the predicate, the
                        // children are list items" — inconsistent and
                        // unrunnable. Forbidding `input` keeps the
                        // contract clean: `.in` is a valueless container.
                        NamePattern = "\\.in$",
                        Values = { "input" },
                        Description = "The .in operator is a valueless container; its admissible values live entirely in the `.:` child list",
                    },
                },
            };
        }

        // JOIN ON condition: LHS is a column-with-operator suffix (name
        // pulled from sql-column-condition-names), RHS is typically ANOTHER
        // column reference (qualified `table.col`), not a literal value.
        // Putting `sql-qualified-column` second in the OUTER Kind list (after
        // the LHS-naming `sql-column-condition`) makes PickLiteral fall
        // through to sql-qualified-column-names for the RHS, so emitted
        // joins read `users.id.eq:orders.user_id` rather than the
        // nonsensical `users.id.eq:"some-quoted-string"` the WHERE variant
        // would produce. The trailing text/number/... fallbacks remain so
        // the rare literal-RHS join (`status.eq:5`) is still legal and the
        // synth doesn't dead-end if the catalog ever misses.
        //
        // KEY DIFFERENCE FROM Condition() (WHERE):
        // JOIN ON conditions have NO inner value-list children — not even
        // for the `.in` operator. WHERE allows `status.in / .:active /
        // .:pending` because the values are LITERALS the SQL builder
        // serializes as a constant set (IN ('active', 'pending')). In JOIN
        // ON the RHS is a column reference like `audits.id` — there's no
        // natural meaning to a multi-value JOIN predicate against column
        // refs (`a.id.in (b.x, b.y)` isn't standard SQL). So the join
        // condition is leaf-only: a single LHS-RHS pair, no children. The
        // SQL builder still accepts hand-written `.in` value-list children
        // inside `[on]` if anyone writes that by hand, the synth just
        // refuses to teach it.
        internal static SlotChild JoinCondition()
        {
            return new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "sql-column-condition,sql-qualified-column,text,number,boolean,date,guid,content,value",
                Description = "Join predicate: LHS is a column-with-operator suffix, RHS is the joined-side column reference (leaf-only — value-list children are a WHERE-clause feature, not meaningful in JOIN ON)",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                // ExactlyOne — typical JOIN ON has ONE predicate (the FK
                // linkage `t1.col = t2.col`). Composite-key joins exist but
                // are rare; the corpus shouldn't teach 50% double-predicate
                // joins (`OneOrMore` made PickCount return 1 or 2 with equal
                // probability). The SQL builder still accepts multiple
                // predicate nodes inside [and] for hand-written composite
                // joins — only the synth refuses to emit them.
                //
                // Contrast with Condition() (WHERE clauses) which keeps
                // OneOrMore — multi-predicate WHEREs (`where status='x' and
                // amount > 100`) are common SQL.
                Cardinality = SlotChildCardinality.ExactlyOne,
                // Lexical-context-driven naming and value: the LHS is the
                // SOURCE table's qualified column-with-operator
                // (`<src_table>.<col>.<op>`), the RHS is the JOIN target's
                // qualified column (`<joined_table>.<col>`). The ancestor
                // walk finds the nearest enclosing [table] for the source
                // and the nearest enclosing [join] for the target — both
                // of which sit in the immediate ancestry of this condition
                // node. Yields semantically real predicates against tables
                // actually in this query, instead of flat-catalog
                // `users.tenant_id`/`invoices.id` draws unrelated to the
                // FROM clause.
                NameTemplate = "{ancestor:table}.{catalog:sql-column-condition-names}",
                ValueTemplate = "{ancestor:join}.{catalog:column-name}",
                // No Children declared — JOIN conditions are leaf nodes.
                // (See the block comment above the method for the WHY.)
                // The previous NamePattern Excludes constraint is gone too:
                // with no Children, there's nothing to constrain. `.in` is
                // now just an operator the LHS name can carry (e.g.
                // `users.id.in:audits.id`), with no value-list semantics.
            };
        }

        internal static SlotChild Join(int depth)
        {
            // JOIN ON is AND-only (in the schema). The SQL builder accepts
            // hand-written `[or]` inside `[on]` so existing Hyperlambda using
            // OR-based joins keeps working at runtime — but the synth refuses
            // to teach that pattern. OR-based JOIN predicates are syntactically
            // valid SQL yet semantically rare: real JOIN ON clauses are
            // conjunctive ("rows match when ALL of these column relationships
            // hold"). Allowing OR in the schema would inflate the corpus with
            // structurally legal but practically nonexistent shapes.
            //
            // - `allowOr: false` passed to BooleanLevel propagates to every
            //   nested level so deep OR can't slip in via recursion either.
            // - [on]'s child list contains ONLY [and] (no [or] sibling).
            // - [and] is Required + ExactlyOne — no ExactlyOneOf constraint
            //   needed (one-option choice is trivially satisfied).
            // - JoinCondition (not Condition) is used so the RHS of each
            //   predicate resolves to a column reference like
            //   `orders.user_id` rather than a literal text/number.
            var onAnd = BooleanLevel("and", 1, JoinCondition, allowOr: false);
            onAnd.Required = true;
            onAnd.Cardinality = SlotChildCardinality.ExactlyOne;
            var result = new SlotChild
            {
                Name = "join",
                Type = "string",
                Kind = "table-name",
                Description = "Joined table name",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Children =
                {
                    new SlotChild
                    {
                        Name = "type",
                        Type = "string",
                        Kind = "join-type",
                        Description = "Join type: inner, left, right, or full",
                        Required = false,
                        DefaultValue = "inner",
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrOne,
                    },
                    new SlotChild
                    {
                        Name = "as",
                        Type = "string",
                        Kind = "table-alias",
                        Description = "Optional joined table alias",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrOne,
                    },
                    new SlotChild
                    {
                        Name = "on",
                        Type = "lambda",
                        Kind = "sql-predicate-root",
                        Description = "Join predicate tree comparing columns (AND-only at the schema level; the SQL builder still accepts hand-written [or] for legacy code)",
                        Required = true,
                        Mode = SlotChildMode.StructuredArguments,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Children = { onAnd },
                    },
                },
            };
            if (depth > 0)
                result.Children.Add(Join(depth - 1));
            return result;
        }
    }

    /// <summary>
    /// Child signature for [sql.read].
    /// </summary>
    public class SqlReadSignature : ISlotSignature
    {
        /// <inheritdoc />
        // `[table]` is ExactlyOne for SELECT: the SQL builder DOES support
        // multiple `[table]` siblings (rendered comma-separated as the legacy
        // implicit cross-join `FROM t1, t2 WHERE ...`), but that form is
        // archaic and effectively never used in modern Hyperlambda — JOINs
        // hang off ONE primary table. Allowing OneOrMore in the schema gave
        // the synth's PickCount a ~50% chance of emitting two top-level
        // `[table]`s, each with its own independent JOIN chain — a Cartesian
        // product of joined sub-trees whose JOIN predicates often reference
        // tables that aren't even in the FROM clause. Legal SQL, semantic
        // nonsense, and wildly over-represented in the corpus. Hand-written
        // Hyperlambda that needs the comma-FROM form can still emit multiple
        // `[table]` nodes — the SQL builder accepts it — but the synth no
        // longer teaches the LLM that shape.
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, true),
            Columns(),
            SqlCreateSignature.Where(),
            Group(),
            Order(),
            Limit(),
            Offset(),
        };

        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> OutputChildren => new[] { RowList() };

        // Row-list output shape: every read/select slot returns one unnamed
        // child per row, each row carrying the selected columns as named
        // children. Column names are derived at synthesis time from the
        // statement (column list, aggregate aliases, etc.), so the per-row
        // child set is declared as a wildcard.
        internal static SlotChild RowList()
        {
            return new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "row",
                Description = "One row returned by the read; child nodes carry the selected column values, with each child's name being the column name or alias from the SELECT statement",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "column-value",
                        Description = "Column value; child name is the column name (or alias) declared in the read",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            };
        }

        internal static SlotChild Columns()
        {
            return new SlotChild
            {
                Name = "columns",
                Type = "lambda",
                Description = "Columns or aggregate expressions to select; omitted or empty means all columns",
                Required = false,
                Mode = SlotChildMode.DynamicNamedValues,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "column-name,aggregate-expression",
                        Description = "Column name or aggregate expression; optional [as] child declares an alias",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        // OneOrMore: when [columns] IS emitted it must list at least one real column, so
                        // the read's result shadow always carries traversable columns (@read/N/*/<col>)
                        // instead of collapsing to bare SELECT-* rows. [columns] itself stays ZeroOrOne
                        // (above), so a genuine column-less SELECT * still emits when [columns] is omitted.
                        Cardinality = SlotChildCardinality.OneOrMore,
                        Children =
                        {
                            new SlotChild
                            {
                                Name = "as",
                                Type = "string",
                                Kind = "column-alias",
                                Description = "Column alias",
                                Required = false,
                                Mode = SlotChildMode.ValueOrExpression,
                                Cardinality = SlotChildCardinality.ZeroOrOne,
                            },
                        },
                    },
                },
            };
        }

        internal static SlotChild Group()
        {
            return new SlotChild
            {
                Name = "group",
                Type = "lambda",
                Description = "Columns or aggregate expressions to group by",
                Required = false,
                Mode = SlotChildMode.DynamicNamedValues,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "column-name,aggregate-expression",
                        Description = "Column name or aggregate expression",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                    },
                },
            };
        }

        internal static SlotChild Order()
        {
            return new SlotChild
            {
                Name = "order",
                Type = "string",
                Kind = "column-name,aggregate-expression",
                Description = "Column, comma-separated columns, or aggregate expression to order by",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Children =
                {
                    Direction("Order direction for this specific order node"),
                },
            };
        }

        internal static SlotChild Direction(string description = "Default order direction")
        {
            return new SlotChild
            {
                Name = "direction",
                Type = "string",
                Kind = "sort-direction",
                Description = description,
                Required = false,
                DefaultValue = "asc",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            };
        }

        internal static SlotChild Limit()
        {
            return new SlotChild
            {
                Name = "limit",
                Type = "long",
                Description = "Maximum number of rows to return; omitted defaults to 25 and -1 suppresses the generated limit clause",
                Required = false,
                DefaultValue = "25",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            };
        }

        internal static SlotChild Offset()
        {
            return new SlotChild
            {
                Name = "offset",
                Type = "long",
                Description = "Number of rows to skip",
                Required = false,
                DefaultValue = "0",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            };
        }

    }

    /// <summary>
    /// Child signature for [sql.update].
    /// </summary>
    public class SqlUpdateSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            SqlCreateSignature.Values(),
            SqlCreateSignature.Where(),
        };
    }

    /// <summary>
    /// Child signature for [sql.delete].
    /// </summary>
    public class SqlDeleteSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            SqlCreateSignature.Where(),
        };
    }

    /// <summary>
    /// Child signature for executable create CRUD slots.
    /// </summary>
    public class DbCreateSignature : SqlCreateSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Generate(),
            ReturnId(),
            Table(SlotChildCardinality.ExactlyOne, false),
            Values(),
        };

        internal static SlotChild Generate()
        {
            return new SlotChild
            {
                Name = "generate",
                Type = "bool",
                Description = "Whether to only generate SQL and parameter nodes instead of executing it",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            };
        }

        internal static SlotChild ReturnId()
        {
            return new SlotChild
            {
                Name = "return-id",
                Type = "bool",
                Description = "Whether to return the created row ID",
                Required = false,
                DefaultValue = "true",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
            };
        }
    }

    /// <summary>
    /// Child signature for executable read CRUD slots.
    /// </summary>
    public class DbReadSignature : SqlReadSignature
    {
        /// <inheritdoc />
        // See SqlReadSignature: `[table]` ExactlyOne for the corpus, builder
        // still permits multiple at runtime.
        public override IEnumerable<SlotChild> Children => new[]
        {
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, true),
            Columns(),
            SqlCreateSignature.Where(),
            Group(),
            Order(),
            Limit(),
            Offset(),
        };
    }

    /// <summary>
    /// Child signature for executable update CRUD slots.
    /// </summary>
    public class DbUpdateSignature : SqlUpdateSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            SqlCreateSignature.Values(),
            // WHERE is REQUIRED for executable UPDATE — corpus must not
            // model "UPDATE x SET ..." statements that touch every row.
            SqlCreateSignature.Where(required: true),
        };
    }

    /// <summary>
    /// Child signature for executable delete CRUD slots.
    /// </summary>
    public class DbDeleteSignature : SqlDeleteSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            // WHERE is REQUIRED for executable DELETE — same rationale as
            // DbUpdateSignature.
            SqlCreateSignature.Where(required: true),
        };
    }

    /// <summary>
    /// Child signature for dispatching data create slots.
    /// </summary>
    public class DataCreateSignature : DbCreateSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DatabaseType(),
            Generate(),
            ReturnId(),
            Table(SlotChildCardinality.ExactlyOne, false),
            Values(),
        };

        internal static SlotChild DatabaseType()
        {
            return new SlotChild
            {
                Name = "database-type",
                Type = "string",
                Kind = "database-type",
                Description = "Database adapter to use instead of the configured default",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                // Inherit from an enclosing [database-type] (e.g. data.connect's
                // adapter). Opening a PostgreSQL connection then issuing MySQL
                // operations against it isn't valid in real Hyperlambda — the
                // adapter is established at the connection layer and every
                // CRUD slot inside that connection's body must use the same
                // adapter. The template resolves to the outer adapter when one
                // is in scope; falls through to PickValue's flat catalog draw
                // at the outermost level where no enclosing adapter exists
                // (also lets data.connect itself pick a random adapter for the
                // initial connection).
                ValueTemplate = "{ancestor:database-type}",
            };
        }
    }

    /// <summary>
    /// Child signature for data.transaction.* slots (create / commit / rollback).
    /// </summary>
    /// <remarks>
    /// Every <c>data.*</c> slot extending <see cref="helpers.DataSlotBase"/>
    /// reads an optional [database-type] child to select which provider-
    /// specific implementation to dispatch to (mysql.transaction.create vs
    /// pgsql.transaction.create, etc.). The CRUD slots already declare this
    /// via <see cref="DataCreateSignature.DatabaseType"/>; transactions
    /// historically had no signature and so emitted no [database-type]
    /// child at all — meaning a [data.transaction.create] inside a
    /// [data.connect] whose adapter was MySQL would silently fall back to
    /// <c>settings.DefaultDatabaseType</c> at runtime, potentially a
    /// different adapter than the open connection. The ancestor-template
    /// in DatabaseType() ensures inheritance from the enclosing
    /// [data.connect]'s adapter when present.
    /// </remarks>
    public class DataTransactionSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
        };

        /// <inheritdoc />
        public IEnumerable<SlotConstraint> Constraints => System.Array.Empty<SlotConstraint>();

        /// <inheritdoc />
        public IEnumerable<SlotChild> OutputChildren => System.Array.Empty<SlotChild>();
    }

    /// <summary>
    /// Child signature for dispatching data read and scan slots.
    /// </summary>
    public class DataReadSignature : DbReadSignature
    {
        /// <inheritdoc />
        // See SqlReadSignature: `[table]` ExactlyOne for the corpus, builder
        // still permits multiple at runtime.
        public override IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, true),
            Columns(),
            SqlCreateSignature.Where(),
            Group(),
            Order(),
            Limit(),
            Offset(),
        };
    }

    /// <summary>
    /// Child signature for dispatching data update slots.
    /// </summary>
    public class DataUpdateSignature : DbUpdateSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            SqlCreateSignature.Values(),
            // WHERE is REQUIRED — same rationale as DbUpdateSignature.
            SqlCreateSignature.Where(required: true),
        };
    }

    /// <summary>
    /// Child signature for dispatching data delete slots.
    /// </summary>
    public class DataDeleteSignature : DbDeleteSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
            DbCreateSignature.Generate(),
            SqlCreateSignature.Table(SlotChildCardinality.ExactlyOne, false),
            // WHERE is REQUIRED — same rationale as DbDeleteSignature.
            SqlCreateSignature.Where(required: true),
        };
    }

    /// <summary>
    /// Child signature for raw SQL execution slots.
    /// </summary>
    public class DataExecuteSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
            SqlParameter(),
        };

        /// <inheritdoc />
        // Declared virtual so [data.select] / dialect select slots can override
        // with the row-list shape without falling into DIM-shadow (the class
        // member would otherwise be hidden from `ISlotSignature` dispatch).
        public virtual IEnumerable<SlotChild> OutputChildren => new SlotChild[0];

        internal static SlotChild SqlParameter()
        {
            return new SlotChild
            {
                Name = "*",
                Type = "object",
                Kind = "sql-parameter-value,text,number,boolean,date,guid,content,value",
                Description = "SQL parameter value; child name is used as the parameter name referenced by the SQL statement",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    /// <summary>
    /// Child signature for concrete raw SQL execution slots.
    /// </summary>
    public class DbExecuteSignature : DataExecuteSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            SqlParameter(),
        };
    }

    /// <summary>
    /// Child signature for raw SQL select slots.
    /// </summary>
    public class DataSelectSignature : DataExecuteSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            DataCreateSignature.DatabaseType(),
            Max(),
            MultipleResultSets(),
            SqlParameter(),
        };

        /// <inheritdoc />
        public override IEnumerable<SlotChild> OutputChildren => new[] { SqlReadSignature.RowList() };

        internal static SlotChild Max()
        {
            return new SlotChild
            {
                Name = "max",
                Type = "long",
                Description = "Maximum number of rows to return; omitted or -1 returns all rows",
                Required = false,
                DefaultValue = "-1",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        internal static SlotChild MultipleResultSets()
        {
            return new SlotChild
            {
                Name = "multiple-result-sets",
                Type = "bool",
                Description = "Whether multiple SELECT statements in the SQL input should be returned as separate child result containers",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    /// <summary>
    /// Child signature for concrete raw SQL select slots.
    /// </summary>
    public class DbSelectSignature : DataSelectSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Max(),
            MultipleResultSets(),
            SqlParameter(),
        };
    }
}
