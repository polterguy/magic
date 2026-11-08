/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Reflection;
using Xunit;
using magic.signals.contracts;
using magic.lambda.scheduler.signatures;

namespace magic.lambda.scheduler.tests
{
    public class TaskIdTests
    {
        [Theory]
        [InlineData("tasks.create")]
        [InlineData("tasks.delete")]
        [InlineData("tasks.execute")]
        public void TaskIdCanBeGivenAsValueOrAsIdChild(string name)
        {
            var slot = SlotNamed(name);
            Assert.True(slot.ValueOrChildrenRequired);
            Assert.False(slot.ValueRequired);
        }

        [Fact]
        public void CreateTaskDeclaresIdChild()
        {
            var child = new CreateTaskSignature().Children.Single(x => x.Name == "id");
            Assert.Equal(SlotChildMode.ValueOrExpression, child.Mode);
            Assert.False(child.Required);
        }

        [Theory]
        [InlineData("tasks.get")]
        [InlineData("tasks.schedule")]
        public void SlotsNotResolvingIdChildKeepRequiringAValue(string name)
        {
            Assert.False(SlotNamed(name).ValueOrChildrenRequired);
        }

        static SlotAttribute SlotNamed(string name)
        {
            return Assembly.Load("magic.lambda.scheduler").GetTypes()
                .SelectMany(x => x.GetCustomAttributes<SlotAttribute>())
                .Single(x => x.Name == name);
        }
    }
}
