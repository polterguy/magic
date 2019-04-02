/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;

namespace magic.signals.contracts
{
    public class SlotAttribute : Attribute
    {
        public string Name { get; set; }
    }
}
