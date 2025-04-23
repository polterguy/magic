/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Globalization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [format] slot allowing you to format some value according to some pattern.
    /// </summary>
    [Slot(Name = "format")]
    public class Format : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var value = input.GetEx<object>();
            var pattern = input.Children.First(x => x.Name == "pattern").GetEx<string>();
            var culture = CultureInfo.InvariantCulture;
            var cultureNode = input.Children.FirstOrDefault(x => x.Name == "culture");
            if (cultureNode != null)
                culture = new CultureInfo(cultureNode.GetEx<string>());
            input.Clear();
            input.Value = string.Format(culture, pattern, value);
        }
    }
}
