/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
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

        public T Get<T>()
        {
            if (Value != null && typeof(T) == Value.GetType())
                return (T)Value;
            return (T)Convert.ChangeType(Value, typeof(T), CultureInfo.InvariantCulture);
        }

        public void Add(Node value)
        {
            value.Parent = this;
            _children.Add(value);
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
    }
}
