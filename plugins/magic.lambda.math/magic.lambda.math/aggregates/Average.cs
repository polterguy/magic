using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.math.utilities;

namespace magic.lambda.math.aggregates
{
    /// <summary>
    /// [math.average] slot calculating the mean of all numbers.
    /// </summary>
    [Slot(Name = "math.average")]
    public class Average : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await signaler.SignalAsync("eval", input);
            dynamic sum = Utilities.GetBase(input);
            int count = 1;
            foreach (var idx in Utilities.AllButBase(input))
            {
                sum += idx;
                count++;
            }
            input.Clear();
            input.Value = sum / count;
        }
    }
}
