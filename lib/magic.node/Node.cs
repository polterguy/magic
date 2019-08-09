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
        string _name;

        public string Name
        {
            get { return _name; }
            set
            {
                _name = value ?? throw new ArgumentNullException(nameof(value));
            }
        }

        public object Value { get; set; }

        public List<Node> Children { get; } = new List<Node>();

        public Node()
        {
            Name = string.Empty;
        }

        public Node(string name)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
        }

        public Node(string name, object value)
            : this(name)
        {
            Value = value;
        }

        public T Get<T>()
        {
            return (T)Convert.ChangeType(Value, typeof(T), CultureInfo.InvariantCulture);
        }
    }
}
