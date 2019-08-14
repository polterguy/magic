/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections;
using System.Globalization;
using System.Collections.Generic;

namespace magic.node
{
    public class Node
    {
        readonly List<Node> _children;
        string _name;

        public Node()
        {
            _name = "";
            _children = new List<Node>();
        }

        public Node(string name)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            _children = new List<Node>();
        }

        public Node(string name, object value)
        {
            Name = name;
            Value = value;
            _children = new List<Node>();
        }

        public Node(string name, object value, IEnumerable<Node> children)
        {
            Name = name;
            Value = value;
            _children = new List<Node>(children);
            foreach (var idx in _children)
            {
                idx.Parent = this;
            }
        }

        public string Name
        {
            get { return _name; }
            set { _name = value ?? throw new ArgumentNullException(nameof(value)); }
        }

        public object Value { get; set; }

        public IEnumerable<Node> Children
        {
            get { return _children; }
        }

        public Node Parent { get; private set; }

        public Node Previous
        {
            get
            {
                if (Parent == null)
                    return null;

                var indexOfThis = Parent._children.IndexOf(this);
                if (indexOfThis == 0)
                    return null;
                return Parent._children[indexOfThis - 1];
            }
        }

        public Node Next
        {
            get
            {
                if (Parent == null)
                    return null;

                var indexOfThis = Parent._children.IndexOf(this);
                if (indexOfThis == Parent._children.Count - 1)
                    return null;
                return Parent._children[indexOfThis + 1];
            }
        }

        public object Get()
        {
            if (Value is Expression ex)
            {
                var nodes = ex.Evaluate(new Node[] { this });

                if (nodes.Count() > 1)
                    throw new ApplicationException("Multiple values returned from Expression in Get");

                if (nodes.Any())
                    return nodes.First().Get();

                return null;
            }
            return Value;
        }

        public IEnumerable<Node> Evaluate()
        {
            if (!(Value is Expression ex))
                throw new ApplicationException($"'{Value}' is not a valid Expression");

            return ex.Evaluate(new Node[] { this });
        }

        public T Get<T>()
        {
            if (typeof(T) != typeof(string) && typeof(IEnumerable).IsAssignableFrom(typeof(T)))
                throw new ApplicationException($"Use {nameof(GetList)} to retrieve enumerables.");

            if (Value == null)
                return default(T);

            if (typeof(T) == Value.GetType())
                return (T)Value;

            if (typeof(T) != typeof(Expression) && Value.GetType() == typeof(Expression))
            {
                // Unrolling Expression for caller, assuming a single Node as our result, returning its value.
                var nodes = (Value as Expression).Evaluate(new Node[] { this });

                if (nodes.Count() > 1)
                    throw new ApplicationException("Expression yields multiple results, when only one result was expected");
                else if (nodes.Count() == 1)
                    return nodes.First().Get<T>();

                return default(T);
            }

            // Converting, the simple version.
            return (T)Convert.ChangeType(Value, typeof(T), CultureInfo.InvariantCulture);
        }

        public IEnumerable<T> GetList<T>()
        {
            // Verifying we've got anything at all here, returning an empty enumerator if not.
            if (Value == null)
                yield break;

            if (Value is Expression ex)
            {
                foreach (var idx in ex.Evaluate(new Node[] { this }))
                {
                    if (idx.Value is Expression exInner)
                    {
                        foreach (var idxInner in idx.GetList<T>())
                        {
                            yield return idxInner;
                        }
                    }
                    else
                    {
                        yield return idx.Get<T>();
                    }
                }
            }
            else
            {
                foreach (var idx in Value as IEnumerable)
                {
                    if (idx == null)
                        yield return default(T);
                    else if (typeof(T) == idx.GetType())
                        yield return (T)idx;
                    else
                        yield return (T)Convert.ChangeType(idx, typeof(T), CultureInfo.InvariantCulture);
                }
            }
        }

        public void Add(Node value)
        {
            if (value.Parent != null && value.Parent != this)
                value.Parent.Remove(value); // Removing from its original parent.

            value.Parent = this;
            _children.Add(value);
        }

        public void Insert(int index, Node value)
        {
            if (value.Parent != null && value.Parent != this)
                value.Parent.Remove(value); // Removing from its original parent.

            value.Parent = this;
            _children.Insert(index, value);
        }

        public void AddRange(IEnumerable<Node> values)
        {
            foreach (var idx in values)
            {
                Add(idx);
            }
        }

        public void Remove(Node value)
        {
            _children.Remove(value);
        }

        public void Clear()
        {
            _children.Clear();
        }

        public Node Clone()
        {
            var result = new Node(Name, Value);
            foreach(var idx in Children)
            {
                result.Add(idx.Clone());
            }
            return result;
        }

        public void UnTie()
        {
            Parent = null;
        }
    }
}
