/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.signals.contracts
{
    /// <summary>
    /// Attribute class you need to mark your signals with, to associate your
    /// slot with a string/name.
    ///
    /// Its name can later be used to invoke your slot using the ISignaler.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
    public class SlotAttribute : Attribute
    {
        /// <summary>
        /// Name of slot.
        /// </summary>
        public string Name { get; set; }
    }
}
