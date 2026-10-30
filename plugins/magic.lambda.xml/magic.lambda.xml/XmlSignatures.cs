/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.xml.signatures
{
    public class Lambda2XmlSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();
    }
}
