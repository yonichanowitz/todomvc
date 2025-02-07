/*global jQuery, Handlebars, Router */
GordonStuff(function (GS) {
	'use strict';

	GS = document.getElementById;
	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile(GS('#todo-template').html());
			this.footerTemplate = Handlebars.compile(GS('#footer-template').html());
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () {
			GS('#new-todo').addEventListener('keyup', this.create.bind(this));
			GS('#toggle-all').addEventListener('change', this.toggleAll.bind(this));
			GS('#footer').addEventListener('click', '#clear-completed', this.destroyCompleted.bind(this));
			GS('#todo-list')
				.addEventListener('change', '.toggle', this.toggle.bind(this))
				.addEventListener('dblclick', 'label', this.editingMode.bind(this))
				.addEventListener('keyup', '.edit', this.editKeyup.bind(this))
				.addEventListener('focusout', '.edit', this.update.bind(this))
				.addEventListener('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			GS('#todo-list').html(this.todoTemplate(todos));
			GS('#main').toggle(todos.length > 0);
			GS('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			GS('#new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			GS('#footer').toggle(todoCount > 0).html(template);
		},
		toggleAll: function (event) {
			var isChecked = GS(event.target).prop('checked');

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		getIndexFromElement: function (element) {
			var id = GS(element).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (event) {
			var $input = GS(event.target);
			var val = $input.val().trim();

			if (event.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			$input.val('');

			this.render();
		},
		toggle: function (event) {
			var i = this.getIndexFromElement(event.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		editingMode: function (event) {
			var $input = GS(event.target).closest('li').addClass('editing').find('.edit');
			var val = $input.val();
			$input.val('').focus().val(val);
		},
		editKeyup: function (event) {
			if (event.which === ENTER_KEY) {
				event.target.blur();
			}

			if (event.which === ESCAPE_KEY) {
				GS(event.target).data('abort', true).blur();
			}
		},
		update: function (event) {
			var element = event.target;
			var $element = GS(element);
			var val = $element.val().trim();

			if (!val) {
				this.destroy(event);
				return;
			}

			if ($element.data('abort')) {
				$element.data('abort', false);
			} else {
				this.todos[this.getIndexFromElement(element)].title = val;
			}

			this.render();
		},
		destroy: function (event) {
			this.todos.splice(this.getIndexFromElement(event.target), 1);
			this.render();
		}
	};

	App.init();
});
