/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;

namespace magic.node
{
    /// <summary>
    /// Graph class allowing you to declare tree structures as name/value/children collections.
    /// Note, contrary to JSON, and similar formats, the name is not a "key", and can be duplicated
    /// multiple times in the same "scope". In addition, each node can have both a value and children.
    /// </summary>
    public class Node : ICloneable
    {
        readonly List<Node> _children;
        string _name;

        /// <summary>
        /// Creates an empty node, with a "" name, a null value, and zero children.
        /// </summary>
        public Node()
        {
            Name = "";
            _children = new List<Node>();
        }

        /// <summary>
        /// Creates a new node with the specified name, null value, and zero children.
        /// </summary>
        /// <param name="name">Name for node.</param>
        public Node(string name)
        {
            Name = name;
            _children = new List<Node>();
        }

        /// <summary>
        /// Creates a new node with the given name, given value, and zero children.
        /// </summary>
        /// <param name="name">Name for node.</param>
        /// <param name="value">Value for node.</param>
        public Node(string name, object value)
        {
            Name = name;
            Value = value;
            _children = new List<Node>();
        }

        /// <summary>
        /// Creates a new node with the given name, value and children.
        ///
        /// Notice, the initial children will be untied from the current
        /// parent, if any.
        /// </summary>
        /// <param name="name">Name for node.</param>
        /// <param name="value">Value for node.</param>
        /// <param name="children">Initial children collection for node.</param>
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

        /// <summary>
        /// Name of your node.
        /// </summary>
        public string Name
        {
            get { return _name; }
            set { _name = value ?? throw new ArgumentNullException(nameof(value)); }
        }

        /// <summary>
        /// Value of your node.
        /// </summary>
        public object Value { get; set; }

        /// <summary>
        /// Your node's children.
        /// </summary>
        public IEnumerable<Node> Children
        {
            get { return _children; }
        }

        /// <summary>
        /// Your node's parent node, if any.
        ///
        /// Will be null if the node has no parents and is a root node.
        /// </summary>
        public Node Parent { get; private set; }

        /// <summary>
        /// Returns the "elder sibling" for your node, if any.
        /// </summary>
        public Node Previous
        {
            get
            {
                // Node has no "next sibling" node unless it has a parent node.
                if (Parent == null)
                    return null;

                var indexOfThis = Parent._children.IndexOf(this);
                if (indexOfThis == 0)
                    return null; // No more "younger siblings".

                return Parent._children[indexOfThis - 1];
            }
        }

        /// <summary>
        /// Returns the "younger sibling" for your node, if any.
        /// </summary>
        public Node Next
        {
            get
            {
                // Node has no "next sibling" node unless it has a parent node.
                if (Parent == null)
                    return null;

                var indexOfThis = Parent._children.IndexOf(this);
                if (indexOfThis == Parent._children.Count - 1)
                    return null; // No more "elder siblings".

                return Parent._children[indexOfThis + 1];
            }
        }

        /// <summary>
        /// Appends a node into the node's children collection.
        /// </summary>
        /// <param name="value">Node to append. Notice, will be untied from any previous parents.</param>
        public void Add(Node value)
        {
            // Removing from its original parent.
            value.Parent?.Remove(value);

            value.Parent = this;
            _children.Add(value);
        }

        /// <summary>
        /// Inserts the node at the specified index in its children collection.
        /// </summary>
        /// <param name="index">Where to insert the node.</param>
        /// <param name="value">Node to insert. Notice, will be untied from any previous parents.</param>
        public void Insert(int index, Node value)
        {
            // Removing from its original parent.
            value.Parent?.Remove(value);

            value.Parent = this;
            _children.Insert(index, value);
        }

        /// <summary>
        /// Inserts the node before the node's current position in its parent's children collection.
        /// </summary>
        /// <param name="value">Node to insert. Notice, will be untied from any previous parents.</param>
        public void InsertBefore(Node value)
        {
            if (Parent == null)
                throw new ArgumentException("Cannot insert before since current node is a root node");

            // Removing from its original parent.
            value.Parent?.Remove(value);

            var indexOfThis = Parent._children.IndexOf(this);
            Parent.Insert(indexOfThis, value);
        }

        /// <summary>
        /// Inserts the node after the node's current position in its parent's children collection.
        /// </summary>
        /// <param name="value">Node to insert. Notice, will be untied from any previous parents.</param>
        public void InsertAfter(Node value)
        {
            if (Parent == null)
                throw new ArgumentException("Cannot insert after since current node is a root node");

            // Removing from its original parent.
            value.Parent?.Remove(value);

            var indexOfThis = Parent._children.IndexOf(this);
            Parent.Insert(indexOfThis + 1, value);
        }

        /// <summary>
        /// Appends a range of nodes to the node's children collection.
        /// </summary>
        /// <param name="values">Nodes to append. Notice, all nodes will be untied from any previous parents.</param>
        public void AddRange(IEnumerable<Node> values)
        {
            // ToList in case caller supplies for instance a Children collection to another node, which would
            // invalidate the enumerator during untie operation.
            foreach (var idx in values.ToList())
            {
                Add(idx);
            }
        }

        /// <summary>
        /// Removes the specified node from the node's children collection.
        /// </summary>
        /// <param name="value">Removes the specified node from the Children collection of the current node.</param>
        public void Remove(Node value)
        {
            if (_children.Remove(value))
                value.Parent = null;
            else
                throw new ArgumentException("Node does not belong to current node's children collection.");
        }

        /// <summary>
        /// Removes all nodes from the node's children collection.
        /// </summary>
        public void Clear()
        {
            // Making sure we reset nodes' parents properties first.
            foreach (var idx in _children)
            {
                idx.Parent = null;
            }
            _children.Clear();
        }

        /// <summary>
        /// Clones the given node, except its parent or ancestor node(s),
        /// and returns the result.
        /// </summary>
        /// <returns>A clone of the current node. Notice, values are also cloned,
        /// but only if they implement ICloneable.</returns>
        public Node Clone()
        {
            var value = Value;
            if (value is ICloneable cloner)
                value = cloner.Clone();

            var result = new Node(Name, value);
            foreach (var idx in Children)
            {
                result.Add(idx.Clone());
            }
            return result;
        }

        /// <summary>
        /// Removes the node from its parent's children collection.
        /// </summary>
        public void UnTie()
        {
            Parent._children.Remove(this);
            Parent = null;
        }

        /// <summary>
        /// Sorts the node given the specified functor.
        /// </summary>
        /// <param name="functor">Comparison functor</param>
        public void Sort(Comparison<Node> functor)
        {
            _children.Sort(functor);
        }

        /// <summary>
        /// Removes all nodes except the first max number of nodes.
        /// </summary>
        /// <param name="max">Maximum number of nodes to keep</param>
        public void Max(int max)
        {
            if (_children.Count > max)
                _children.RemoveRange(max, _children.Count - max);
        }

        #region [ -- Interface implementation -- ]

        object ICloneable.Clone()
        {
            return Clone();
        }

        #endregion
    }
}
