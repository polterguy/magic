/*
 * Magic Cloud's "App" widgets for the Web Designer - plain custom elements,
 * no build step, no framework.
 *
 * Each one's light-DOM fallback (the markup the palette drops into the page)
 * is what the Web Designer's canvas shows, since that canvas never runs this
 * script - and it is what a visitor with scripts off sees too. Once this
 * script does run, connectedCallback() replaces it with a Shadow DOM that
 * actually fetches and binds data. Both the fallback (styled by
 * /assets/magic-widgets.css) and the Shadow DOM below read the same CSS
 * custom properties, set on the host element's own style by the Style
 * panel's "Data grid" / "Login form" groups - so a colour picked there looks
 * the same whichever one is on screen.
 */
(function () {
  'use strict';

  var TICKET_KEY = 'magic-ticket';

  function getTicket() {
    try {
      return localStorage.getItem(TICKET_KEY);
    } catch (error) {
      return null;
    }
  }

  function setTicket(value) {
    try {
      localStorage.setItem(TICKET_KEY, value);
    } catch (error) {
      // Private browsing or a blocked store - nothing this widget can do about it.
    }
  }

  /*
   * Every call these widgets make is to this same site's own Magic backend,
   * so there is nowhere an attached token could leak to - attaching it when
   * present and letting a public endpoint ignore it is simpler than asking
   * the backend first whether this particular endpoint needs one.
   */
  function authedFetch(url, init) {
    init = init || {};
    var ticket = getTicket();
    if (ticket) {
      init.headers = Object.assign({}, init.headers, { Authorization: 'Bearer ' + ticket });
    }
    return fetch(url, init);
  }

  var GRID_STYLE =
    ':host { display: block; }' +
    /*
     * Fixed, not auto: an auto layout keeps re-measuring every column's width
     * off its cells' actual content, so the moment a click-to-edit cell swaps
     * its text for an <input>, the column it is in (and usually its
     * neighbours) visibly jumps width. Fixed instead sizes every column once,
     * off the header row, and never again - so starting or ending an edit
     * cannot move anything.
     */
    'table { width: 100%; border-collapse: collapse; table-layout: fixed; }' +
    'thead tr { background: var(--magic-grid-header-bg, #1f2430); }' +
    'th { color: var(--magic-grid-header-color, #ffffff); text-align: left; padding: .5em .75em; }' +
    'tbody tr:nth-child(even) { background: var(--magic-grid-row-alt-bg, #f6f7f9); }' +
    // A column's width is now fixed - long text clips with an ellipsis rather than forcing it wider.
    'td { background: var(--magic-grid-cell-bg, transparent); ' +
    '  border-bottom: 1px solid var(--magic-grid-border-color, #e2e4e8); padding: .5em .75em; ' +
    '  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
    '.pager { display: flex; gap: .5em; align-items: center; margin-top: .5em; }' +
    '.pager button { cursor: pointer; }' +
    '.empty, .error { padding: .75em; color: #99412e; }' +
    'td.editable { cursor: pointer; }' +
    'td.editable:hover { outline: 1px dashed var(--magic-grid-border-color, #e2e4e8); outline-offset: -2px; }' +
    'td input { width: 100%; box-sizing: border-box; font: inherit; padding: .2em; }' +
    'td input.invalid { outline: 1px solid #b3261e; }' +
    '.row-delete { background: transparent; border: 1px solid #b3261e; color: #b3261e; ' +
    '  border-radius: 3px; cursor: pointer; padding: .2em .5em; font-size: .85em; }' +
    'tr.filter-row th { padding: .35em .75em; background: var(--magic-grid-header-bg, #1f2430); }' +
    'tr.filter-row input { width: 100%; box-sizing: border-box; font: inherit; padding: .2em; }';

  /*
   * Turns what an <input> gives back into what the column's own Hyperlambda
   * type expects in the PUT body - a number typed into a text box is still a
   * string until this runs, and the server has no reason to coerce for you.
   */
  function coerceValue(type, raw) {
    if (type === 'long') {
      var n = parseInt(raw, 10);
      return isNaN(n) ? null : n;
    }
    if (type === 'decimal' || type === 'double') {
      var f = parseFloat(raw);
      return isNaN(f) ? null : f;
    }
    if (type === 'bool') {
      return raw === true || raw === 'true';
    }
    return raw;
  }

  // Which <input type> reads naturally as this column's own Hyperlambda type.
  function inputTypeFor(type) {
    if (type === 'long' || type === 'decimal' || type === 'double') {
      return 'number';
    }
    if (type === 'date') {
      return 'date';
    }
    if (type === 'bool') {
      return 'checkbox';
    }
    return 'text';
  }

  class MagicDataGrid extends HTMLElement {
    connectedCallback() {
      // A reconnect (e.g. the element being moved) must not rebuild and refetch.
      if (this._built) {
        return;
      }
      this._built = true;
      this._offset = 0;
      this._limit = parseInt(this.getAttribute('data-page-size') || '10', 10) || 10;
      // Column name -> the text currently typed into its filter box.
      this._filters = {};
      this._filterTimer = null;

      var root = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = GRID_STYLE;
      root.appendChild(style);

      this._table = document.createElement('table');
      this._table.setAttribute('part', 'table');
      this._thead = document.createElement('thead');
      this._tbody = document.createElement('tbody');
      this._table.appendChild(this._thead);
      this._table.appendChild(this._tbody);
      this._pager = document.createElement('div');
      this._pager.className = 'pager';
      this._pager.setAttribute('part', 'pager');
      root.appendChild(this._table);
      root.appendChild(this._pager);

      this._renderHead();
      this._load();
    }

    _columns() {
      try {
        return JSON.parse(this.getAttribute('data-columns') || '[]');
      } catch (error) {
        return [];
      }
    }

    _renderHead() {
      var columns = this._columns();
      var hasDeleteColumn = !!this.getAttribute('data-delete-url');
      var headRow = document.createElement('tr');
      headRow.setAttribute('part', 'head-row');
      columns.forEach(function (column) {
        var th = document.createElement('th');
        th.setAttribute('part', 'head-cell');
        th.textContent = column.label || column.name;
        headRow.appendChild(th);
      });
      // An unlabelled trailing header for the per-row Delete button's column.
      if (hasDeleteColumn) {
        headRow.appendChild(document.createElement('th'));
      }
      var rows = [headRow];
      if (this.getAttribute('data-filterable')) {
        rows.push(this._renderFilterRow(columns, hasDeleteColumn));
      }
      this._thead.replaceChildren.apply(this._thead, rows);
    }

    /*
     * One text box per column, each wired to the exact query argument
     * crudify itself generates for it - Table.Column.eq for any type,
     * Table.Column.like (wildcarded both sides, so it reads as "contains")
     * for a string one. Every crud-read/crud-count endpoint crudify writes
     * accepts both unconditionally, so which one applies is decided purely
     * by the column's own [type] - never by asking the server what this
     * particular table supports, because the answer is always the same.
     */
    _renderFilterRow(columns, hasDeleteColumn) {
      var self = this;
      var row = document.createElement('tr');
      row.className = 'filter-row';
      row.setAttribute('part', 'filter-row');
      columns.forEach(function (column) {
        var th = document.createElement('th');
        th.setAttribute('part', 'filter-cell');
        var input = document.createElement('input');
        input.type = inputTypeFor(column.type);
        input.placeholder = 'Filter…';
        input.value = self._filters[column.name] || '';
        input.addEventListener('input', function () {
          self._onFilterInput(column.name, input.value);
        });
        th.appendChild(input);
        row.appendChild(th);
      });
      if (hasDeleteColumn) {
        row.appendChild(document.createElement('th'));
      }
      return row;
    }

    /*
     * Debounced, not sent on every keystroke - filtering reloads the whole
     * page from row 0, so sending it mid-word would just discard most of its
     * own results the moment the next character arrives.
     */
    _onFilterInput(name, value) {
      var self = this;
      this._filters[name] = value;
      if (this._filterTimer) {
        clearTimeout(this._filterTimer);
      }
      this._filterTimer = setTimeout(function () {
        self._filterTimer = null;
        self._offset = 0;
        self._load();
      }, 350);
    }

    // Table.Column from a /magic/modules/<module>/Table style read URL.
    _tableName() {
      var readUrl = this.getAttribute('data-read-url') || '';
      var path = readUrl.split('?')[0].split('/');
      return path[path.length - 1];
    }

    /*
     * The &Table.Column.op=value fragment every filled-in filter box
     * contributes - entirely omitted for a column nobody has typed into, so
     * an empty filter box restricts nothing, same as it not existing.
     */
    _filterQuery() {
      if (!this.getAttribute('data-filterable')) {
        return '';
      }
      var table = this._tableName();
      var self = this;
      return this._columns().map(function (column) {
        var raw = self._filters[column.name];
        if (raw === undefined || raw === null || raw === '') {
          return '';
        }
        var op = column.type === 'string' ? 'like' : 'eq';
        var value = op === 'like' ? '%' + raw + '%' : raw;
        return '&' + encodeURIComponent(table + '.' + column.name + '.' + op) +
          '=' + encodeURIComponent(value);
      }).join('');
    }

    _primaryKey() {
      try {
        return JSON.parse(this.getAttribute('data-primary-key') || '[]');
      } catch (error) {
        return [];
      }
    }

    _load() {
      var readUrl = this.getAttribute('data-read-url');
      if (!readUrl || readUrl.indexOf('REPLACE_ME') !== -1) {
        this._tbody.innerHTML = '<tr><td class="empty">' +
          'Set data-read-url (and data-columns) in the Inspector to a real endpoint.</td></tr>';
        return;
      }
      var columns = this._columns();
      var url = readUrl +
        (readUrl.indexOf('?') === -1 ? '?' : '&') +
        'limit=' + this._limit + '&offset=' + this._offset + this._filterQuery();
      var self = this;
      authedFetch(url)
        .then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new Error('HTTP ' + response.status + ': ' + (text || response.statusText));
            });
          }
          return response.json();
        })
        .then(function (rows) {
          self._renderRows(rows || [], columns);
          self._loadCount();
        })
        .catch(function (error) {
          self._tbody.innerHTML = '<tr><td class="error">' + escapeHtml(String(error.message || error)) + '</td></tr>';
          self._renderPager(null);
        });
    }

    _renderRows(rows, columns) {
      this._tbody.replaceChildren();
      if (rows.length === 0) {
        this._tbody.innerHTML = '<tr><td class="empty">No rows.</td></tr>';
        return;
      }
      var self = this;
      var deleteUrl = this.getAttribute('data-delete-url');
      var canDelete = deleteUrl && this._primaryKey().length > 0;
      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        tr.setAttribute('part', 'row');
        columns.forEach(function (column) {
          var td = document.createElement('td');
          td.setAttribute('part', 'cell');
          var value = row[column.name];
          td.textContent = value === undefined || value === null ? '' : String(value);
          if (column.editable) {
            td.classList.add('editable');
            td.title = 'Click to edit';
            td.addEventListener('click', function () {
              self._beginEdit(td, row, column);
            });
          }
          tr.appendChild(td);
        });
        if (canDelete) {
          var actions = document.createElement('td');
          actions.setAttribute('part', 'cell');
          var button = document.createElement('button');
          button.className = 'row-delete';
          button.setAttribute('part', 'row-delete');
          button.type = 'button';
          button.textContent = 'Delete';
          button.addEventListener('click', function () {
            self._deleteRow(row);
          });
          actions.appendChild(button);
          tr.appendChild(actions);
        }
        self._tbody.appendChild(tr);
      });
    }

    /*
     * Turns one cell into an <input> on click, pre-filled with its current
     * value. Enter or losing focus commits it with a PUT; Escape puts the
     * text back without sending anything. Only ever called for a column the
     * Inspector already marked [editable], which only exists when the table
     * actually has a crud-update endpoint that accepts it.
     */
    _beginEdit(td, row, column) {
      if (td.querySelector('input')) {
        return;
      }
      var original = row[column.name];
      var input = document.createElement('input');
      input.type = inputTypeFor(column.type);
      if (input.type === 'checkbox') {
        input.checked = !!original;
      } else {
        input.value = original === undefined || original === null ? '' : String(original);
      }
      td.textContent = '';
      td.appendChild(input);
      input.focus();
      if (typeof input.select === 'function') {
        input.select();
      }

      var self = this;
      function revert() {
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('keydown', onKeydown);
        td.textContent = original === undefined || original === null ? '' : String(original);
      }
      function onBlur() {
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('keydown', onKeydown);
        self._commitEdit(td, row, column, input, original);
      }
      function onKeydown(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          onBlur();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          revert();
        }
      }
      input.addEventListener('blur', onBlur);
      input.addEventListener('keydown', onKeydown);
    }

    /*
     * One field, one PUT - the primary key plus only the column just edited,
     * never the whole row. crudify's generated update endpoint only touches
     * the fields actually present in the request, so this cannot clobber a
     * sibling column this grid was never shown in the first place.
     */
    _commitEdit(td, row, column, input, original) {
      var updateUrl = this.getAttribute('data-update-url');
      var value = coerceValue(column.type, input.type === 'checkbox' ? input.checked : input.value);
      var body = {};
      this._primaryKey().forEach(function (name) {
        body[name] = row[name];
      });
      body[column.name] = value;

      input.disabled = true;
      authedFetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new Error('HTTP ' + response.status + ': ' + (text || response.statusText));
            });
          }
          row[column.name] = value;
          td.textContent = value === undefined || value === null ? '' : String(value);
        })
        .catch(function (error) {
          // Left open rather than reverted - the value just typed is still
          // there to fix and retry, instead of being silently thrown away.
          input.disabled = false;
          input.classList.add('invalid');
          input.title = String(error.message || error);
        });
    }

    _pkQuery(row) {
      return this._primaryKey()
        .map(function (name) { return encodeURIComponent(name) + '=' + encodeURIComponent(row[name]); })
        .join('&');
    }

    _deleteRow(row) {
      if (!window.confirm('Delete this row?')) {
        return;
      }
      var self = this;
      var deleteUrl = this.getAttribute('data-delete-url');
      authedFetch(deleteUrl + '?' + this._pkQuery(row), { method: 'DELETE' })
        .then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new Error('HTTP ' + response.status + ': ' + (text || response.statusText));
            });
          }
          // Reloads the current page rather than just removing the row from
          // view - deleting the last row on a page should pull one in from
          // the next, and the total the pager shows has changed too.
          self._load();
        })
        .catch(function (error) {
          window.alert('Could not delete: ' + String(error.message || error));
        });
    }

    _loadCount() {
      var countUrl = this.getAttribute('data-count-url');
      if (!countUrl || countUrl.indexOf('REPLACE_ME') !== -1) {
        this._renderPager(null);
        return;
      }
      var filterQuery = this._filterQuery();
      var url = countUrl + (countUrl.indexOf('?') === -1 ? filterQuery.replace('&', '?') : filterQuery);
      var self = this;
      authedFetch(url)
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (result) { self._renderPager(result ? result.count : null); })
        .catch(function () { self._renderPager(null); });
    }

    _renderPager(total) {
      var self = this;
      this._pager.replaceChildren();

      var prev = document.createElement('button');
      prev.setAttribute('part', 'pager-button');
      prev.textContent = 'Previous';
      prev.disabled = this._offset <= 0;
      prev.addEventListener('click', function () {
        self._offset = Math.max(0, self._offset - self._limit);
        self._load();
      });

      var info = document.createElement('span');
      info.textContent = (total === null || total === undefined)
        ? ('Rows ' + (this._offset + 1) + '–' + (this._offset + this._limit))
        : ('Rows ' + (this._offset + 1) + '–' + Math.min(this._offset + this._limit, total) + ' of ' + total);

      var next = document.createElement('button');
      next.setAttribute('part', 'pager-button');
      next.textContent = 'Next';
      if (total !== null && total !== undefined) {
        next.disabled = this._offset + this._limit >= total;
      }
      next.addEventListener('click', function () {
        self._offset += self._limit;
        self._load();
      });

      this._pager.appendChild(prev);
      this._pager.appendChild(info);
      this._pager.appendChild(next);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  customElements.define('magic-data-grid', MagicDataGrid);

  var CREATE_STYLE =
    ':host { display: block; max-width: 420px; }' +
    'label { display: block; margin-bottom: .75em; font-size: .9em; }' +
    'input { display: block; width: 100%; margin-top: .25em; padding: .4em .5em; box-sizing: border-box; font: inherit; }' +
    'button { background: var(--magic-create-button-bg, #1f2430); color: var(--magic-create-button-color, #ffffff); ' +
    '  border: none; padding: .5em 1em; cursor: pointer; }' +
    '.error { color: #b3261e; margin-top: .5em; }' +
    '.success { color: #2e7d46; margin-top: .5em; }' +
    '.error:empty, .success:empty { display: none; }';

  /*
   * One field per column crud-create's own input lists - nothing picked or
   * narrowed in the Inspector, since that list already IS exactly what a new
   * row needs (crudify never puts a primary key or a defaulted column in it).
   * Submitting clears the form and shows a plain confirmation; it does not
   * reach into any Data Grid elsewhere on the page to refresh it - the two
   * widgets have no way to know about each other, and inventing one is a
   * bigger thing than this widget is for.
   */
  class MagicDataCreate extends HTMLElement {
    connectedCallback() {
      if (this._built) {
        return;
      }
      this._built = true;

      var root = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = CREATE_STYLE;
      root.appendChild(style);

      this._inputs = {};
      var form = document.createElement('form');
      this._columns().forEach(function (column) {
        var label = document.createElement('label');
        label.setAttribute('part', 'label');
        label.textContent = column.label || column.name;
        var input = document.createElement('input');
        input.setAttribute('part', 'input');
        input.type = inputTypeFor(column.type);
        input.name = column.name;
        label.appendChild(input);
        form.appendChild(label);
        this._inputs[column.name] = input;
      }, this);

      var button = document.createElement('button');
      button.setAttribute('part', 'button');
      button.type = 'submit';
      button.textContent = this.getAttribute('data-submit-label') || 'Create';
      form.appendChild(button);

      this._message = document.createElement('p');
      this._message.setAttribute('part', 'message');
      form.appendChild(this._message);

      root.appendChild(form);

      var self = this;
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        self._submit();
      });
    }

    _columns() {
      try {
        return JSON.parse(this.getAttribute('data-columns') || '[]');
      } catch (error) {
        return [];
      }
    }

    _showMessage(text, isError) {
      this._message.textContent = text;
      this._message.className = isError ? 'error' : 'success';
      this._message.setAttribute('part', isError ? 'error' : 'success');
    }

    _submit() {
      var createUrl = this.getAttribute('data-create-url');
      if (!createUrl || createUrl.indexOf('REPLACE_ME') !== -1) {
        this._showMessage('Set data-create-url (and data-columns) in the Inspector to a real endpoint.', true);
        return;
      }
      var self = this;
      var columns = this._columns();
      var body = {};
      columns.forEach(function (column) {
        var input = self._inputs[column.name];
        body[column.name] = coerceValue(column.type, input.type === 'checkbox' ? input.checked : input.value);
      });
      authedFetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new Error('HTTP ' + response.status + ': ' + (text || response.statusText));
            });
          }
          self._showMessage('Created.', false);
          columns.forEach(function (column) {
            var input = self._inputs[column.name];
            if (input.type === 'checkbox') {
              input.checked = false;
            } else {
              input.value = '';
            }
          });
        })
        .catch(function (error) {
          self._showMessage(String(error.message || error), true);
        });
    }
  }

  customElements.define('magic-data-create', MagicDataCreate);

  var LOGIN_STYLE =
    ':host { display: block; background: var(--magic-login-bg, transparent); padding: 1em; max-width: 320px; }' +
    'label { display: block; margin-bottom: .75em; font-size: .9em; }' +
    'input { display: block; width: 100%; margin-top: .25em; padding: .4em .5em; box-sizing: border-box; }' +
    'button { background: var(--magic-login-button-bg, #1f2430); color: var(--magic-login-button-color, #ffffff); ' +
    '  border: none; padding: .5em 1em; cursor: pointer; }' +
    '.error { color: #b3261e; margin-top: .5em; }' +
    '.error:empty { display: none; }';

  class MagicLoginForm extends HTMLElement {
    connectedCallback() {
      if (this._built) {
        return;
      }
      this._built = true;

      var root = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = LOGIN_STYLE;
      root.appendChild(style);

      var form = document.createElement('form');

      var userLabel = document.createElement('label');
      userLabel.setAttribute('part', 'label');
      userLabel.textContent = 'Username';
      var user = document.createElement('input');
      user.setAttribute('part', 'input');
      user.type = 'text';
      user.name = 'username';
      user.required = true;
      userLabel.appendChild(user);

      var passLabel = document.createElement('label');
      passLabel.setAttribute('part', 'label');
      passLabel.textContent = 'Password';
      var pass = document.createElement('input');
      pass.setAttribute('part', 'input');
      pass.type = 'password';
      pass.name = 'password';
      pass.required = true;
      passLabel.appendChild(pass);

      var button = document.createElement('button');
      button.setAttribute('part', 'button');
      button.type = 'submit';
      button.textContent = 'Log in';

      var error = document.createElement('p');
      error.setAttribute('part', 'error');
      error.className = 'error';

      form.appendChild(userLabel);
      form.appendChild(passLabel);
      form.appendChild(button);
      form.appendChild(error);
      root.appendChild(form);

      var self = this;
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        error.textContent = '';
        var authUrl = self.getAttribute('data-auth-url') || '/magic/system/auth/authenticate';
        var query = '?username=' + encodeURIComponent(user.value) + '&password=' + encodeURIComponent(pass.value);
        fetch(authUrl + query)
          .then(function (response) {
            if (!response.ok) {
              throw new Error(response.status === 401 ? 'Wrong username or password' : 'Login failed (' + response.status + ')');
            }
            return response.json();
          })
          .then(function (result) {
            setTicket(result.ticket);
            location.href = self.getAttribute('data-redirect') || '/';
          })
          .catch(function (err) {
            error.textContent = String(err.message || err);
          });
      });
    }
  }

  customElements.define('magic-login-form', MagicLoginForm);

  /*
   * The payload of the stored ticket, read for its role and expiry only -
   * this is a client-side convenience, not verification. The signature is
   * never checked here, because it does not need to be: the real gate is
   * every crudified endpoint's own auth.ticket.verify, which checks it
   * server-side regardless of what this element decides. This only ever
   * decides whether to show someone a page they could not do anything on
   * anyway, same as the Data Grid's auth-aware fetch already assumes.
   */
  function decodeTicket(ticket) {
    try {
      var body = ticket.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var padded = body + '==='.slice((body.length + 3) % 4);
      return JSON.parse(atob(padded));
    } catch (error) {
      return null;
    }
  }

  /*
   * Gates everything after it on the page behind a login, and optionally a
   * role. Nothing to theme and nothing left to show once it has decided -
   * it either sends the visitor away or clears its own placeholder, so
   * there is no Shadow DOM here, unlike the other two widgets.
   *
   * Runs once, at the end of <body> like the rest of this file - a page
   * does flash whatever sits above it for a moment before this redirects,
   * since nothing here can execute before the browser has parsed down to
   * this script. Closing that gap means hiding the whole page until this
   * has run, which trades a brief flash for a worse failure: if the script
   * ever fails to load, the page would stay hidden forever instead of just
   * showing itself. Not worth that trade for what this is actually for.
   */
  class MagicRequireLogin extends HTMLElement {
    connectedCallback() {
      if (this._checked) {
        return;
      }
      this._checked = true;

      var redirect = this.getAttribute('data-redirect') || '/';
      // Never bounce the login page back to itself.
      if (location.pathname === redirect) {
        this.replaceChildren();
        return;
      }

      var required = (this.getAttribute('data-role') || '')
        .split(',').map(function (role) { return role.trim(); }).filter(Boolean);
      var ticket = getTicket();
      var payload = ticket ? decodeTicket(ticket) : null;
      var now = Math.floor(Date.now() / 1000);
      var expired = !payload || (typeof payload.exp === 'number' && payload.exp <= now);
      var roles = (payload && typeof payload.role === 'string')
        ? payload.role.split(',').map(function (role) { return role.trim(); })
        : [];
      var satisfied = !expired &&
        (required.length === 0 || required.some(function (role) { return roles.indexOf(role) !== -1; }));

      if (!satisfied) {
        location.replace(redirect);
        return;
      }
      this.replaceChildren();
    }
  }

  customElements.define('magic-require-login', MagicRequireLogin);
})();
