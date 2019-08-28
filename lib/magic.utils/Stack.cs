/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Collections.Generic;

namespace magic.utils
{
	public class Stack<T>
	{
        Synchronizer<List<T>> _connections = new Synchronizer<List<T>>(new List<T>());

        public void Push(T value)
        {
            _connections.Write((x) => x.Add(value));
        }

        public T Peek()
        {
            return _connections.Read((x) => x.Last());
        }

        public void Pop()
        {
            _connections.Write((x) => x.RemoveAt(x.Count - 1));
        }
	}
}
