/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.signals.contracts;
using magic.node.extensions;
using magic.endpoint.services.slots.misc;

namespace magic.endpoint.tests
{
    /*
     * Tests [endpoints.list], and with it the meta data retrieved about each endpoint, by listing endpoint
     * files written for the purpose into a folder of their own, deleted again when the test is done.
     */
    public sealed class EndpointListingTests : IDisposable
    {
        readonly string _name = "listing-" + Guid.NewGuid().ToString("N");
        readonly string _folder;

        public EndpointListingTests()
        {
            // The slot lists both of these folders, and fails if either does not exist.
            Directory.CreateDirectory(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "system"));
            _folder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "modules", _name);
            Directory.CreateDirectory(_folder);
        }

        public void Dispose()
        {
            Directory.Delete(_folder, true);
        }

        void Write(string filename, string hl)
        {
            File.WriteAllText(Path.Combine(_folder, filename), hl);
        }

        async Task<Node> ListAsync()
        {
            var services = Common.Initialize();
            var signaler = services.GetService<ISignaler>();
            var node = new Node("endpoints.list");
            await signaler.SignalAsync("endpoints.list", node);
            return node;
        }

        async Task<Node> EndpointAsync(string file, string verb)
        {
            var list = await ListAsync();
            return list.Children.Single(x =>
                x.Children.Any(y => y.Name == "path" && y.Get<string>() == "magic/modules/" + _name + "/" + file) &&
                x.Children.Any(y => y.Name == "verb" && y.Get<string>() == verb));
        }

        static Node Child(Node node, string name) => node.Children.FirstOrDefault(x => x.Name == name);

        [Fact]
        public async Task PlainEndpoint()
        {
            Write("plain.get.hl", @".description:Returns a greeting
auth.ticket.verify:root, admin
response.headers.set
   Content-Type:text/plain
return:foo");
            var endpoint = await EndpointAsync("plain", "get");
            Assert.Equal("Returns a greeting", Child(endpoint, "description").Value);
            Assert.Equal(new[] { "root", "admin" }, Child(endpoint, "auth").Children.Select(x => x.Value).ToArray());
            Assert.Equal("custom", Child(endpoint, "type").Value);
            Assert.Equal("text/plain", Child(endpoint, "produces").Value);
            Assert.Null(Child(endpoint, "consumes"));       // GET endpoints have no payload.
            Assert.Null(Child(endpoint, "input"));
        }

        [Fact]
        public async Task LeadingCommentIsTheDescription()
        {
            Write("commented.get.hl", @"..:This is the comment
return:foo");
            var endpoint = await EndpointAsync("commented", "get");
            Assert.Equal("This is the comment", Child(endpoint, "description").Value);
            Assert.Equal("application/json", Child(endpoint, "produces").Value);
        }

        [Fact]
        public async Task AuthorizationWithoutRolesIsAnyAuthenticatedUser()
        {
            Write("anyone.get.hl", @"auth.ticket.verify
return:foo");
            var endpoint = await EndpointAsync("anyone", "get");
            Assert.Equal("*", Child(endpoint, "auth").Children.Single().Value);
        }

        [Fact]
        public async Task PublicEndpointHasNoAuthorization()
        {
            Write("public.get.hl", @"return:foo");
            var endpoint = await EndpointAsync("public", "get");
            Assert.Null(Child(endpoint, "auth"));
        }

        [Fact]
        public async Task ArgumentsWithDescriptionsAndHandling()
        {
            Write("args.post.hl", @".accept:application/xml
.arguments
   ..:The name
   name:string
   age:int
.handling
   name:youtube
return:foo");
            var endpoint = await EndpointAsync("args", "post");
            Assert.Equal("application/xml", Child(endpoint, "consumes").Value);
            var input = Child(endpoint, "input").Children.ToList();
            Assert.Equal(2, input.Count);
            Assert.Equal("name", Child(input[0], "name").Value);
            Assert.Equal("string", Child(input[0], "type").Value);
            Assert.Equal("The name", Child(input[0], "description").Value);
            Assert.Equal("youtube", Child(input[0], "handling").Value);
            Assert.Equal("int", Child(input[1], "type").Value);
            Assert.Null(Child(input[1], "description"));
        }

        [Fact]
        public async Task DefaultsToJsonPayload()
        {
            Write("json.post.hl", @".arguments
   name:string
return:foo");
            var endpoint = await EndpointAsync("json", "post");
            Assert.Equal("application/json", Child(endpoint, "consumes").Value);
        }

        [Fact]
        public async Task ForeignKeysOnPostAndPut()
        {
            Write("fk.put.hl", @".arguments
   artist:long
.foreign-keys
   .
      column:artist
      table:Artist
      foreign_column:ArtistId
      foreign_name:Name
      long:bool:true
return:foo");
            var endpoint = await EndpointAsync("fk", "put");
            var lookup = Child(Child(endpoint, "input").Children.Single(), "lookup");
            Assert.Equal("Artist", Child(lookup, "table").Value);
            Assert.Equal("ArtistId", Child(lookup, "key").Value);
            Assert.Equal("Name", Child(lookup, "name").Value);
            Assert.Equal(true, Child(lookup, "long").Value);
        }

        [Fact]
        public async Task CrudCountEndpoint()
        {
            Write("count.get.hl", @".type:crud-count
return:foo");
            var endpoint = await EndpointAsync("count", "get");
            Assert.Equal("crud-count", Child(endpoint, "type").Value);
            var output = Child(endpoint, "output").Children.Single();
            Assert.Equal("count", Child(output, "name").Value);
            Assert.Equal("long", Child(output, "type").Value);
            Assert.Equal(false, Child(endpoint, "array").Value);
        }

        [Fact]
        public async Task CrudReadEndpoint()
        {
            Write("read.get.hl", @".type:crud-read
.arguments
   Album.Title.eq:string
.handling
   Album.Picture:image
data.connect:db
   sqlite.read
      table:Album
      columns
         Album.Title
         Album.Picture
         Album.Id
            as:Identity
return:foo");
            var endpoint = await EndpointAsync("read", "get");
            Assert.Equal("crud-read", Child(endpoint, "type").Value);
            Assert.Equal(true, Child(endpoint, "array").Value);
            var columns = Child(endpoint, "output").Children.ToList();
            Assert.Equal(3, columns.Count);
            Assert.Equal("Title", Child(columns[0], "name").Value);
            Assert.Equal("string", Child(columns[0], "type").Value);
            Assert.Equal("image", Child(columns[1], "handling").Value);
            Assert.Equal("Identity", Child(columns[2], "name").Value);
        }

        [Fact]
        public async Task SeveralContentTypesCannotBeDeduced()
        {
            Write("branches.get.hl", @"if
   .lambda
      response.headers.set
         Content-Type:text/plain
else
   .lambda
      response.headers.set
         Content-Type:text/html");
            var endpoint = await EndpointAsync("branches", "get");
            Assert.Null(Child(endpoint, "produces"));
        }

        [Fact]
        public async Task BrokenEndpointReportsItsErrorAndTheRestStillListed()
        {
            Write("broken.get.hl", "foo:\"never closed\n   bar");
            Write("fine.get.hl", "return:foo");
            var broken = await EndpointAsync("broken", "get");
            Assert.NotNull(Child(broken, "error"));
            var fine = await EndpointAsync("fine", "get");
            Assert.Null(Child(fine, "error"));
        }

        [Fact]
        public async Task OnlyFilesNamedAfterAVerbAreListed()
        {
            Write("notanendpoint.txt.hl", "return:foo");
            Write("helper.hl", "return:foo");
            Write("weird.fetch.hl", "return:foo");
            Write("socket.socket.hl", "return:foo");
            var list = await ListAsync();
            var paths = list.Children
                .Select(x => Child(x, "path").Get<string>())
                .Where(x => x.StartsWith("magic/modules/" + _name + "/", StringComparison.Ordinal))
                .ToList();
            Assert.Equal(new[] { "magic/modules/" + _name + "/socket" }, paths);
        }

        [Fact]
        public async Task CustomMetaResolver()
        {
            ListEndpoints.AddMetaDataResolver((lambda, verb, args) =>
                lambda.Children.Any(x => x.Name == ".custom-marker-" + _name) ?
                    [new Node("custom", verb)] :
                    []);
            Write("marked.get.hl", @".custom-marker-" + _name + @"
return:foo");
            var endpoint = await EndpointAsync("marked", "get");
            Assert.Equal("get", Child(endpoint, "custom").Value);
        }
    }
}
