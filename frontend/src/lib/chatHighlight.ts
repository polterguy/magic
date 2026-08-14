/*
 * Syntax highlighting for chat answers — highlight.js core with a hand-picked
 * language set, plus a Hyperlambda grammar. Loaded on demand through a dynamic
 * import once an answer actually contains code, so none of it rides along in
 * the main bundle.
 *
 * Token colors map onto the same --cm-* variables Hyper IDE's editor theme
 * uses (see styles.css), so chat code looks like editor code in both themes.
 */

// The --cm-* theme variables chat code colors resolve against — normally
// pulled in by CodeEditor, but chat may highlight before any editor loads.
import '../resources/ainiro.css';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('yaml', yaml);

/*
 * Hyperlambda. Core (dotless) slots and namespaced slots both render as
 * keywords — matching Hyper IDE, where every slot in statement position is
 * the same accent color. The slot list is the runtime's compiled vocabulary.
 */
const CORE =
  'add and apply case compose context convert csv2lambda default else else-if eq eval execute ' +
  'execute-file exists filter floatArray2bytes for-each fork format function get-context get-count ' +
  'get-first-value get-name get-nodes get-value html-decode html2lambda html2markdown html2pdf ' +
  'hyper2lambda if include insert-after insert-before int2words invoke join json2lambda ' +
  'json2lambda-stream json2yaml lambda2csv lambda2html lambda2hyper lambda2json lambda2xml ' +
  'lambda2yaml load-file lt lte map markdown2html mt mte neq not not-exists not-null null or ' +
  'pdf2text reference remove-nodes return return-nodes return-value save-file semaphore set-name ' +
  'set-value set-x signal sleep sort switch throw time try try-signal type types unwrap version ' +
  'vocabulary while whitelist xml2lambda yaml2json yaml2lambda yield';

const NAMESPACED =
  'auth.ticket.create auth.ticket.get auth.ticket.in-role auth.ticket.refresh auth.ticket.verify ' +
  'auth.token.read auth.token.verify cache.clear cache.count cache.get cache.list cache.set ' +
  'cache.try-get config.get config.load config.save config.section console.log crypto.aes.decrypt ' +
  'crypto.aes.encrypt crypto.decrypt crypto.encrypt crypto.fingerprint crypto.get-key crypto.hash ' +
  'crypto.hash.md5 crypto.hash.sha1 crypto.hash.sha256 crypto.hash.sha384 crypto.hash.sha512 ' +
  'crypto.password.hash crypto.password.verify crypto.random crypto.random.int crypto.rsa.create-key ' +
  'crypto.rsa.decrypt crypto.rsa.encrypt crypto.rsa.sign crypto.rsa.verify crypto.seed crypto.sign ' +
  'crypto.verify data.connect data.create data.delete data.execute data.read data.scalar data.scan ' +
  'data.select data.transaction.commit data.transaction.create data.transaction.rollback data.update ' +
  'date.format date.from-unix date.max date.min date.now date.unix endpoints.list execution.kill ' +
  'execution.throttle execution.throttle.create execution.timeout git.branch.list git.checkout ' +
  'git.clone-repo git.commit git.create-repo git.delete-repo git.fetch git.pull git.push ' +
  'git.remote.add git.status github.repo.create github.repo.delete github.repo.list guid.new ' +
  'http.delete http.get http.patch http.post http.put hyperlambda.verify-slots image.chart ' +
  'image.convert image.crop image.generate-qr image.resize image.size io.content.zip-stream ' +
  'io.file.copy io.file.delete io.file.execute io.file.exists io.file.list io.file.list-recursively ' +
  'io.file.load io.file.load-recursively io.file.load.binary io.file.mixin io.file.move ' +
  'io.file.patch io.file.save io.file.save.binary io.file.search io.file.unzip io.folder.copy ' +
  'io.folder.create io.folder.delete io.folder.exists io.folder.list io.folder.list-recursively ' +
  'io.folder.move io.path.get-folder io.stream.close io.stream.open-file io.stream.read ' +
  'io.stream.save-file log.capabilities log.count log.debug log.error log.fatal log.get log.info ' +
  'log.query log.timeshift mail.pop3.fetch mail.smtp.send math.abs math.add math.ceil math.cos ' +
  'math.decrement math.divide math.dot math.floor math.increment math.max math.min math.modulo ' +
  'math.multiply math.random math.round math.sin math.sqrt math.subtract mime.add mime.create ' +
  'mime.list mime.parse mssql.connect mssql.create mssql.delete mssql.execute mssql.execute-batch ' +
  'mssql.read mssql.scalar mssql.select mssql.transaction.commit mssql.transaction.create ' +
  'mssql.transaction.rollback mssql.update mysql.connect mysql.create mysql.delete mysql.execute ' +
  'mysql.read mysql.scalar mysql.select mysql.transaction.commit mysql.transaction.create ' +
  'mysql.transaction.rollback mysql.update odbc.connect odbc.execute odbc.scalar odbc.select ' +
  'odbc.transaction.commit odbc.transaction.create odbc.transaction.rollback openai.tokenize ' +
  'openai.whisper pgsql.connect pgsql.create pgsql.delete pgsql.execute pgsql.read pgsql.scalar ' +
  'pgsql.select pgsql.transaction.commit pgsql.transaction.create pgsql.transaction.rollback ' +
  'pgsql.update puppeteer.click puppeteer.close puppeteer.connect puppeteer.content ' +
  'puppeteer.evaluate puppeteer.fill puppeteer.goto puppeteer.press puppeteer.screenshot ' +
  'puppeteer.select puppeteer.title puppeteer.type puppeteer.url puppeteer.wait-for-selector ' +
  'puppeteer.wait-for-url python.execute request.cookies.get request.cookies.list ' +
  'request.headers.get request.headers.list request.host request.ip request.scheme request.url ' +
  'request.verb response.cookies.set response.headers.set response.status.set server.ip ' +
  'slot.description slot.signature slots.create slots.delete slots.exists slots.get ' +
  'slots.vocabulary sockets.connection.enter-group sockets.connection.leave-group sockets.signal ' +
  'sockets.user.add-to-group sockets.user.remove-from-group sockets.users sockets.users.count ' +
  'sql.create sql.delete sql.read sql.update sqlite.backup sqlite.connect sqlite.connections.flush ' +
  'sqlite.create sqlite.delete sqlite.execute sqlite.load-extension sqlite.read sqlite.scalar ' +
  'sqlite.select sqlite.transaction.commit sqlite.transaction.create sqlite.transaction.rollback ' +
  'sqlite.update strings.builder strings.builder.append strings.byte-count strings.capitalize ' +
  'strings.concat strings.contains strings.ends-with strings.html-decode strings.html-encode ' +
  'strings.join strings.length strings.matches strings.mixin strings.regex-replace strings.replace ' +
  'strings.replace-not-of strings.split strings.starts-with strings.substring strings.to-lower ' +
  'strings.to-upper strings.trim strings.trim-end strings.trim-start strings.url-decode ' +
  'strings.url-encode system.compile system.execute system.is-os system.os system.plugin.execute ' +
  'system.plugin.list system.plugin.load system.plugin.unload tasks.count tasks.create ' +
  'tasks.delete tasks.execute tasks.get tasks.list tasks.schedule tasks.schedule.delete ' +
  'tasks.update time.format time.total-milliseconds timezone.init validators.date ' +
  'validators.default validators.email validators.enum validators.integer validators.mandatory ' +
  'validators.recaptcha validators.regex validators.string validators.url';

hljs.registerLanguage('hyperlambda', () => ({
  name: 'Hyperlambda',
  case_insensitive: false,
  keywords: {
    $pattern: /[a-zA-Z][\w.-]*/,
    keyword: CORE,
    built_in: NAMESPACED,
    literal: 'true false',
  },
  contains: [
    // Comments only exist in statement position, never inside values.
    { className: 'comment', begin: /(?<=^|\n)[ \t]*\/\//, end: /$/ },
    hljs.COMMENT('/\\*', '\\*/'),

    // Expressions - everything after :x: to end of line.
    { className: 'meta', begin: /:x:/, end: /$/ },

    // Type declarations such as :int: and :bool:
    {
      className: 'type',
      begin: /:(?:int|uint|long|ulong|short|ushort|decimal|double|float|single|bool|date|time|guid|char|byte|sbyte|string|node|expression)\b/,
    },

    // Data nodes - names starting with a period at the beginning of a line.
    { className: 'symbol', begin: /(?<=^|\n)[ \t]*\.[\w.-]*/ },

    // Everything after a colon to end of line is a value; multiline
    // @"..." strings inside it keep running past the line break.
    {
      className: 'string',
      begin: /:/,
      end: /$/,
      excludeBegin: true,
      contains: [
        { begin: /@"/, end: /"/, contains: [{ begin: /""/ }] },
      ],
    },
  ],
}));

// Highlights every not-yet-highlighted code block under root.
export function highlightUnder(root: HTMLElement) {
  root.querySelectorAll('pre code[class*="language-"]:not([data-highlighted])').forEach(element => {
    hljs.highlightElement(element as HTMLElement);
  });
}
