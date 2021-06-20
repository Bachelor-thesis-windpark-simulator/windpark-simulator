/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ ((module) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "./src/sass/default.scss":
/*!*******************************!*\
  !*** ./src/sass/default.scss ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/js/city.js":
/*!************************!*\
  !*** ./src/js/city.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ City)
/* harmony export */ });
/* harmony import */ var _grid__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./grid */ "./src/js/grid.js");


class City {
  constructor(width, height, cells = null) {
    this.map = new _grid__WEBPACK_IMPORTED_MODULE_0__.default(width, height, cells);
  }

  toJSON() {
    const { map } = this;
    return {
      map: map.toJSON(),
    };
  }

  static fromJSON(jsonObject) {
    const { map } = jsonObject;
    if (Array.isArray(map)) {
      // Support old serialization format
      return new City(16, 16, map);
    }
    const { width, height, cells } = map;
    return new City(width, height, cells);
  }

  copy(city) {
    this.map.copy(city.map);
  }
}


/***/ }),

/***/ "./src/js/editor/city-browser.js":
/*!***************************************!*\
  !*** ./src/js/editor/city-browser.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CityBrowser)
/* harmony export */ });
/* harmony import */ var _city__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../city */ "./src/js/city.js");


class CityBrowser {
  constructor($element, config, cityStore, saveMode = false) {
    this.$element = $element;
    this.config = config;
    this.$selectedButton = null;
    this.selectedData = null;

    this.$element.addClass('city-browser');

    const setSelection = (button) => {
      if (this.$selectedButton) {
        this.$selectedButton.removeClass('selected');
      }
      this.$selectedButton = $(button);
      this.$selectedButton.addClass('selected');
    };

    const buttons = Object.entries(
      saveMode ? cityStore.getAllUserObjects() : cityStore.getAllObjects()
    ).map(([id, cityJSON]) => $('<div></div>')
      .addClass(['col-6', 'col-md-2', 'mb-3'])
      .append(
        $('<button></button>')
          .addClass('city-browser-item')
          .append(this.createPreviewImage(cityJSON))
          .on('click', (ev) => {
            setSelection(ev.currentTarget);
            this.selectedData = id;
          })
      ));

    if (saveMode) {
      buttons.unshift($('<div></div>')
        .addClass(['col-6', 'col-md-2', 'mb-3'])
        .append($('<button></button>')
          .addClass('city-browser-item-new')
          .on('click', (ev) => {
            setSelection(ev.currentTarget);
            this.selectedData = 'new';
          })));
    }

    this.$element.append($('<div class="row"></div>').append(buttons));
  }

  createPreviewImage(cityJSON) {
    const $canvas = $('<canvas class="city-browser-item-preview"></canvas>')
      .attr({
        width: this.config.cityWidth,
        height: this.config.cityHeight,
      });
    const city = _city__WEBPACK_IMPORTED_MODULE_0__.default.fromJSON(cityJSON);
    const ctx = $canvas[0].getContext('2d');
    city.map.allCells().forEach(([i, j, value]) => {
      ctx.fillStyle = (this.config.tileTypes && this.config.tileTypes[value].color) || '#000000';
      ctx.fillRect(i, j, 1, 1);
    });

    return $canvas;
  }
}


/***/ }),

/***/ "./src/js/editor/map-editor-palette.js":
/*!*********************************************!*\
  !*** ./src/js/editor/map-editor-palette.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MapEditorPalette)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "./node_modules/events/events.js");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);


class MapEditorPalette {
  constructor($element, config) {
    this.$element = $element;
    this.config = config;
    this.activeButton = null;
    this.tileId = null;
    this.events = new (events__WEBPACK_IMPORTED_MODULE_0___default())();

    this.$element.addClass('map-editor-palette');

    this.buttons = Object.entries(config.tileTypes).map(([id, typeCfg]) => $('<button></button>')
      .attr({
        type: 'button',
        title: typeCfg.name,
      })
      .addClass([
        'editor-palette-button',
        'editor-palette-button-tile',
        `editor-palette-button-tile-${id}`,
      ])
      .css({
        backgroundColor: typeCfg.color,
        backgroundImage: `url(${typeCfg.editorIcon})`,
      })
      .on('click', (ev) => {
        if (this.activeButton) {
          this.activeButton.removeClass('active');
        }
        this.activeButton = $(ev.target);
        this.activeButton.addClass('active');
        this.tileId = id;
        this.events.emit('change', id);
      }));

    this.buttons.push($('<div class="separator"></div>'));

    const actionButtons = MapEditorPalette.Actions.map(action => $('<button></button>')
      .attr({
        type: 'button',
        title: action.title,
      })
      .addClass([
        'editor-palette-button',
        'editor-palette-button-action',
        `editor-palette-button-action-${action.id}`,
      ])
      .css({
        backgroundImage: `url(${action.icon})`,
      })
      .on('click', () => {
        this.events.emit('action', action.id);
      }));

    this.buttons.push(...actionButtons);

    this.$element.append(this.buttons);
    if (this.buttons.length) {
      this.buttons[0].click();
    }
  }
}

MapEditorPalette.Actions = [
  {
    id: 'load',
    title: 'Load map',
    icon: 'static/fa/folder-open-solid.svg',
  },
  {
    id: 'save',
    title: 'Save map',
    icon: 'static/fa/save-solid.svg',
  },
  {
    id: 'import',
    title: 'Import map',
    icon: 'static/fa/file-import-solid.svg',
  },
  {
    id: 'export',
    title: 'Export map',
    icon: 'static/fa/file-export-solid.svg',
  },
];


/***/ }),

/***/ "./src/js/editor/map-editor.js":
/*!*************************************!*\
  !*** ./src/js/editor/map-editor.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MapEditor)
/* harmony export */ });
/* harmony import */ var _city__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../city */ "./src/js/city.js");
/* harmony import */ var _map_view__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../map-view */ "./src/js/map-view.js");
/* harmony import */ var _map_editor_palette__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./map-editor-palette */ "./src/js/editor/map-editor-palette.js");
/* harmony import */ var _modal_load__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./modal-load */ "./src/js/editor/modal-load.js");
/* harmony import */ var _modal_save__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./modal-save */ "./src/js/editor/modal-save.js");
/* harmony import */ var _modal_export__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./modal-export */ "./src/js/editor/modal-export.js");
/* harmony import */ var _modal_import__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./modal-import */ "./src/js/editor/modal-import.js");
/* harmony import */ var _object_store__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./object-store */ "./src/js/editor/object-store.js");









class MapEditor {
  constructor($element, city, config, textures) {
    this.$element = $element;
    this.city = city;
    this.config = config;

    this.mapView = new _map_view__WEBPACK_IMPORTED_MODULE_1__.default(city, config, textures);
    this.displayObject = this.mapView.displayObject;

    this.palette = new _map_editor_palette__WEBPACK_IMPORTED_MODULE_2__.default($('<div></div>').appendTo(this.$element), config);

    this.tileType = this.palette.tileId;
    this.palette.events.on('change', (tileType) => {
      this.tileType = tileType;
    });

    this.palette.events.on('action', (id) => {
      if (this.actionHandlers[id]) {
        this.actionHandlers[id]();
      }
    });

    let lastEdit = null;
    this.mapView.events.on('action', ([x, y], props) => {
      if (this.tileType) {
        if (lastEdit && props.shiftKey) {
          const [lastX, lastY] = lastEdit;
          for (let i = Math.min(lastX, x); i <= Math.max(lastX, x); i += 1) {
            for (let j = Math.min(lastY, y); j <= Math.max(lastY, y); j += 1) {
              this.city.map.set(i, j, this.tileType);
            }
          }
        } else {
          this.city.map.set(x, y, this.tileType);
        }
        lastEdit = [x, y];
      }
    });

    this.objectStore = new _object_store__WEBPACK_IMPORTED_MODULE_7__.default('./cities.json');
    this.actionHandlers = {
      load: () => {
        const modal = new _modal_load__WEBPACK_IMPORTED_MODULE_3__.default(this.config, this.objectStore);
        modal.show().then((id) => {
          const jsonCity = id && this.objectStore.get(id);
          if (jsonCity) {
            this.city.copy(_city__WEBPACK_IMPORTED_MODULE_0__.default.fromJSON(jsonCity));
          }
        });
      },
      save: () => {
        const modal = new _modal_save__WEBPACK_IMPORTED_MODULE_4__.default(this.config, this.objectStore);
        modal.show().then((id) => {
          if (id) {
            this.objectStore.set(id === 'new' ? null : id, this.city.toJSON());
          }
        });
      },
      import: () => {
        const modal = new _modal_import__WEBPACK_IMPORTED_MODULE_6__.default();
        modal.show().then((importedData) => {
          if (importedData) {
            this.city.copy(_city__WEBPACK_IMPORTED_MODULE_0__.default.fromJSON(importedData));
          }
        });
      },
      export: () => {
        const modal = new _modal_export__WEBPACK_IMPORTED_MODULE_5__.default(JSON.stringify(this.city));
        modal.show();
      },
    };
  }
}


/***/ }),

/***/ "./src/js/editor/modal-export.js":
/*!***************************************!*\
  !*** ./src/js/editor/modal-export.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ModalExport)
/* harmony export */ });
/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modal */ "./src/js/modal.js");


class ModalExport extends _modal__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(exportData) {
    super({
      title: 'Export map',
    });

    this.$dataContainer = $('<textarea class="form-control"></textarea>')
      .attr({
        rows: 10,
      })
      .text(exportData)
      .appendTo(this.$body);

    this.$copyButton = $('<button></button>')
      .addClass(['btn', 'btn-outline-dark', 'btn-copy', 'mt-2'])
      .text('Copy to clipboard')
      .on('click', () => {
        this.$dataContainer[0].select();
        document.execCommand('copy');
        this.hide();
      })
      .appendTo(this.$footer);
  }
}


/***/ }),

/***/ "./src/js/editor/modal-import.js":
/*!***************************************!*\
  !*** ./src/js/editor/modal-import.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ModalImport)
/* harmony export */ });
/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modal */ "./src/js/modal.js");


class ModalImport extends _modal__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor() {
    super({
      title: 'Import map',
    });

    this.$dataContainer = $('<textarea class="form-control"></textarea>')
      .attr({
        rows: 10,
        placeholder: 'Paste the JSON object here.',
      })
      .appendTo(this.$body);

    // noinspection JSUnusedGlobalSymbols
    this.$errorText = $('<p class="text-danger"></p>')
      .appendTo(this.$footer)
      .hide();

    // noinspection JSUnusedGlobalSymbols
    this.$copyButton = $('<button></button>')
      .addClass(['btn', 'btn-primary'])
      .text('Import')
      .on('click', () => {
        try {
          const imported = JSON.parse(this.$dataContainer.val());
          this.hide(imported);
        } catch (err) {
          this.showError(err.message);
        }
      })
      .appendTo(this.$footer);
  }

  showError(errorText) {
    this.$errorText.html(errorText);
    this.$errorText.show();
  }
}


/***/ }),

/***/ "./src/js/editor/modal-load.js":
/*!*************************************!*\
  !*** ./src/js/editor/modal-load.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ModalLoad)
/* harmony export */ });
/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modal */ "./src/js/modal.js");
/* harmony import */ var _city_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./city-browser */ "./src/js/editor/city-browser.js");



class ModalLoad extends _modal__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(config, cityStore) {
    super({
      title: 'Load map',
      size: 'lg',
    });

    this.$browserContainer = $('<div></div>')
      .appendTo(this.$body);
    this.browser = new _city_browser__WEBPACK_IMPORTED_MODULE_1__.default(this.$browserContainer, config, cityStore);

    // noinspection JSUnusedGlobalSymbols
    this.$cancelButton = $('<button></button>')
      .addClass(['btn', 'btn-secondary'])
      .text('Cancel')
      .on('click', () => {
        this.hide(null);
      })
      .appendTo(this.$footer);

    // noinspection JSUnusedGlobalSymbols
    this.$loadButton = $('<button></button>')
      .addClass(['btn', 'btn-primary'])
      .text('Load')
      .on('click', () => {
        try {
          this.hide(this.browser.selectedData);
        } catch (err) {
          this.showError(err.message);
        }
      })
      .appendTo(this.$footer);
  }

  showError(errorText) {
    this.$errorText.html(errorText);
    this.$errorText.show();
  }
}


/***/ }),

/***/ "./src/js/editor/modal-save.js":
/*!*************************************!*\
  !*** ./src/js/editor/modal-save.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ModalSave)
/* harmony export */ });
/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modal */ "./src/js/modal.js");
/* harmony import */ var _city_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./city-browser */ "./src/js/editor/city-browser.js");



class ModalSave extends _modal__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(config, cityStore) {
    super({
      title: 'Save map',
      size: 'lg',
    });

    this.$browserContainer = $('<div></div>')
      .appendTo(this.$body);
    this.browser = new _city_browser__WEBPACK_IMPORTED_MODULE_1__.default(this.$browserContainer, config, cityStore, true);

    // noinspection JSUnusedGlobalSymbols
    this.$cancelButton = $('<button></button>')
      .addClass(['btn', 'btn-secondary'])
      .text('Cancel')
      .on('click', () => {
        this.hide(null);
      })
      .appendTo(this.$footer);

    // noinspection JSUnusedGlobalSymbols
    this.$saveButton = $('<button></button>')
      .addClass(['btn', 'btn-primary'])
      .text('Save')
      .on('click', () => {
        try {
          this.hide(this.browser.selectedData);
        } catch (err) {
          this.showError(err.message);
        }
      })
      .appendTo(this.$footer);
  }

  showError(errorText) {
    this.$errorText.html(errorText);
    this.$errorText.show();
  }
}


/***/ }),

/***/ "./src/js/editor/object-store.js":
/*!***************************************!*\
  !*** ./src/js/editor/object-store.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ObjectStore)
/* harmony export */ });
class ObjectStore {
  constructor(fixedObjectsPath = null) {
    this.fixedObjects = [];
    this.userObjects = [];

    this.loadUserObjects();
    if (fixedObjectsPath) {
      this.loadFixedObjects(fixedObjectsPath);
    }
  }

  async loadFixedObjects(path) {
    fetch(path, { cache: 'no-store' })
      .then(response => response.json())
      .then((data) => {
        this.fixedObjects = data.cities;
      });
  }

  loadUserObjects() {
    const userObjects = JSON.parse(localStorage.getItem('futureMobility.cityStore.cities'));
    if (userObjects) {
      this.userObjects = userObjects;
    }
  }

  saveLocal() {
    localStorage.setItem('futureMobility.cityStore.cities', JSON.stringify(this.userObjects));
  }

  getAllObjects() {
    return Object.assign(
      {},
      this.getAllUserObjects(),
      this.getAllFixedObjects(),
    );
  }

  getAllFixedObjects() {
    return Object.fromEntries(this.fixedObjects.map((obj, i) => [
      `F${i}`,
      obj,
    ]));
  }

  getAllUserObjects() {
    return Object.fromEntries(this.userObjects.map((obj, i) => [
      `L${i}`,
      obj,
    ]).reverse());
  }

  get(id) {
    if (id[0] === 'F') {
      return this.fixedObjects[id.substr(1)];
    }
    return this.userObjects[id.substr(1)];
  }

  set(id, obj) {
    if (id === null || this.userObjects[id.substr(1)] === undefined) {
      this.userObjects.push(obj);
    } else {
      this.userObjects[id.substr(1)] = obj;
    }
    this.saveLocal();
  }
}


/***/ }),

/***/ "./src/js/emissions-variable.js":
/*!**************************************!*\
  !*** ./src/js/emissions-variable.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EmissionsVariable)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "./node_modules/events/events.js");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _grid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./grid */ "./src/js/grid.js");



class EmissionsVariable {
  constructor(city, config) {
    this.city = city;
    this.config = config;
    this.grid = new _grid__WEBPACK_IMPORTED_MODULE_1__.default(this.city.map.width, this.city.map.height);
    this.events = new (events__WEBPACK_IMPORTED_MODULE_0___default())();

    this.city.map.events.on('update', this.handleCityUpdate.bind(this));
    this.handleCityUpdate(this.city.map.allCells());
  }

  calculate(i, j) {
    const emissions = (x, y) => (this.config.tileTypes[this.city.map.get(x, y)]
      && this.config.tileTypes[this.city.map.get(x, y)].emissions)
      || 0;

    return Math.min(1, Math.max(0, emissions(i, j)
      + this.city.map.nearbyCells(i, j, 1)
        .reduce((sum, [x, y]) => sum + emissions(x, y) * 0.5, 0)
      + this.city.map.nearbyCells(i, j, 2)
        .reduce((sum, [x, y]) => sum + emissions(x, y) * 0.25, 0)));
  }

  handleCityUpdate(updates) {
    const coords = [];
    updates.forEach(([i, j]) => {
      coords.push([i, j]);
      coords.push(...this.city.map.nearbyCells(i, j, 1).map(([x, y]) => [x, y]));
      coords.push(...this.city.map.nearbyCells(i, j, 2).map(([x, y]) => [x, y]));
    });
    // Todo: deduplicating coords might be necessary if the way calculations
    //    and updates are handled is not changed
    coords.forEach(([i, j]) => {
      this.grid.set(i, j, this.calculate(i, j));
    });
    this.events.emit('update', coords);
  }
}


/***/ }),

/***/ "./src/js/grid.js":
/*!************************!*\
  !*** ./src/js/grid.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Grid)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "./node_modules/events/events.js");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Represents a 2D grid map that stores a single Number per cell
 */
class Grid {
  /**
   * Create a new grid
   *
   * @param {number} width
   * @param {number} height
   * @param {number[]} cells
   */
  constructor(width, height, cells = null) {
    this.width = width;
    this.height = height;
    this.cells = cells ? Array.from(cells) : Array(...Array(width * height)).map(() => 0);
    this.events = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
  }

  /**
   * Create a new Grid from a JSON string
   * @return {Grid}
   * @param {object} JSON object
   */
  static fromJSON(jsonObject) {
    const { width, height, cells } = jsonObject;
    return new Grid(width, height, cells);
  }

  /**
   * Serializes to a JSON object
   * @return {{cells: number[], width: number, height: number}}
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      cells: Array.from(this.cells),
    };
  }

  copy(grid) {
    this.width = grid.width;
    this.height = grid.height;
    this.replace(grid.cells);
  }

  /**
   * Map a 2D coordinate to an offset in the cell array
   *
   * @param {number} i
   * @param {number} j
   * @return {number}
   */
  offset(i, j) {
    return j * this.width + i;
  }

  /**
   * Retrieves the value at (i,j)
   *
   * @param {number} i
   * @param {number} j
   * @return {number}
   */
  get(i, j) {
    return this.cells[this.offset(i, j)];
  }

  /**
   * Set the value at (i, j)
   *
   * @fires Grid.events#update
   *
   * @param {number} i
   * @param {number} j
   * @param {number} value
   */
  set(i, j, value) {
    this.cells[this.offset(i, j)] = value;

    /**
     * Update event.
     *
     * Argument is an array of updated cells. Each updated cell is represented
     * by an array with three elements: [i, j, value]
     *
     * @event Grid.events#update
     * @type {[[number, number, number]]}
     */
    this.events.emit('update', [[i, j, value]]);
  }

  replace(cells) {
    this.cells = Array.from(cells);
    this.events.emit('update', this.allCells());
  }

  /**
   * Returns true if (i, j) are valid coordinates within the grid's bounds.
   *
   * @param {number} i
   * @param {number} j
   * @return {boolean}
   */
  isValidCoords(i, j) {
    return i >= 0 && j >= 0 && i < this.width && j < this.height;
  }

  /**
   * Returns all cells, represented as [i, j, value] arrays.
   *
   * @return {[[number, number, number]]}
   */
  allCells() {
    const answer = Array(this.cells.length);
    for (let i = 0; i < this.width; i += 1) {
      for (let j = 0; j < this.height; j += 1) {
        answer.push([i, j, this.cells[j * this.width + i]]);
      }
    }
    return answer;
  }

  /**
   * Get cells adjacent to the cell at (i, j).
   *
   * Each cell is represented by an array of the form [i, j, value]
   * A cell has at most four adjacent cells, which share one side
   * (diagonals are not adjacent).
   *
   * @param {number} i
   * @param {number} j
   * @return {[[number, number, number]]}
   */
  adjacentCells(i, j) {
    return [[i, j - 1], [i + 1, j], [i, j + 1], [i - 1, j]]
      .filter(([x, y]) => this.isValidCoords(x, y))
      .map(([x, y]) => [x, y, this.get(x, y)]);
  }

  /**
   * Returns the cells around the cell at (i, j).
   *
   * Each cells returned is represented as an array [i, j, value].
   * Cells "around" are those reachable by no less than <distance> steps in
   * any direction, including diagonals.
   *
   * @param {number} i
   * @param {number} j
   * @param {number} distance
   * @return {[[number, number, number]]}
   */
  nearbyCells(i, j, distance = 1) {
    const coords = [];
    // Top
    for (let x = i - distance; x < i + distance; x += 1) {
      coords.push([x, j - distance]);
    }
    // Right
    for (let y = j - distance; y < j + distance; y += 1) {
      coords.push([i + distance, y]);
    }
    // Bottom
    for (let x = i + distance; x > i - distance; x -= 1) {
      coords.push([x, j + distance]);
    }
    // Left
    for (let y = j + distance; y > j - distance; y -= 1) {
      coords.push([i - distance, y]);
    }

    return coords
      .filter(([x, y]) => this.isValidCoords(x, y))
      .map(([x, y]) => [x, y, this.get(x, y)]);
  }
}


/***/ }),

/***/ "./src/js/map-view.js":
/*!****************************!*\
  !*** ./src/js/map-view.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MapView)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "./node_modules/events/events.js");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _static_fa_pencil_alt_solid_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../static/fa/pencil-alt-solid.svg */ "./static/fa/pencil-alt-solid.svg");
/* globals PIXI */



const ROAD_TILE = '1';
const TILE_SIZE = 120;

class MapView {
  constructor(city, config, textures) {
    this.displayObject = new PIXI.Container();
    this.city = city;
    this.config = config;
    this.textures = textures;
    this.events = new (events__WEBPACK_IMPORTED_MODULE_0___default())();

    this.bgTiles = Array(this.city.map.width * this.city.map.height);
    this.textureTiles = Array(this.city.map.width * this.city.map.height);

    let pointerActive = false;
    $(window).on('mouseup', () => { pointerActive = false; });

    this.city.map.allCells().forEach(([i, j]) => {
      const bgTile = new PIXI.Graphics();
      bgTile.x = i * TILE_SIZE;
      bgTile.y = j * TILE_SIZE;
      bgTile.interactive = true;
      bgTile.on('mousedown', (ev) => {
        pointerActive = true;
        this.events.emit('action', [i, j], {
          shiftKey: ev.data.originalEvent.shiftKey,
        });
      });
      bgTile.on('mouseover', (ev) => {
        if (pointerActive) {
          this.events.emit('action', [i, j], {
            shiftKey: ev.data.originalEvent.shiftKey,
          });
        }
      });
      bgTile.cursor = `url(${_static_fa_pencil_alt_solid_svg__WEBPACK_IMPORTED_MODULE_1__}) 0 20, auto`;
      this.bgTiles[this.city.map.offset(i, j)] = bgTile;

      const textureTile = new PIXI.Sprite();
      textureTile.x = i * TILE_SIZE;
      textureTile.y = j * TILE_SIZE;
      textureTile.width = TILE_SIZE;
      textureTile.height = TILE_SIZE;
      textureTile.roundPixels = true;
      this.textureTiles[this.city.map.offset(i, j)] = textureTile;
      this.renderTile(i, j);
    });

    this.displayObject.addChild(...this.bgTiles);
    this.displayObject.addChild(...this.textureTiles);
    this.city.map.events.on('update', this.handleCityUpdate.bind(this));
    this.handleCityUpdate(this.city.map.allCells());
  }

  getBgTile(i, j) {
    return this.bgTiles[this.city.map.offset(i, j)];
  }

  getTextureTile(i, j) {
    return this.textureTiles[this.city.map.offset(i, j)];
  }

  renderTile(i, j) {
    this.renderBasicTile(i, j);
    if (this.city.map.get(i, j) === ROAD_TILE) {
      this.renderRoadTile(i, j);
    }
  }

  renderRoadTile(i, j) {
    const connMask = [[i, j - 1], [i + 1, j], [i, j + 1], [i - 1, j]]
      .map(([x, y]) => (!this.city.map.isValidCoords(x, y)
      || this.city.map.get(x, y) === ROAD_TILE
        ? '1' : '0')).join('');
    this.getTextureTile(i, j).texture = this.textures[`road${connMask}`];
    this.getTextureTile(i, j).visible = true;
  }

  renderBasicTile(i, j) {
    const tileType = this.config.tileTypes[this.city.map.get(i, j)] || null;
    this.getBgTile(i, j)
      .clear()
      .beginFill(tileType ? Number(`0x${tileType.color.substr(1)}`) : 0, 1)
      .drawRect(0, 0, TILE_SIZE, TILE_SIZE)
      .endFill();
    this.getTextureTile(i, j).visible = false;
  }

  handleCityUpdate(updates) {
    updates.forEach(([i, j]) => {
      this.renderTile(i, j);
      // Todo: This should be optimized so it's not called twice per frame for the same tile.
      this.city.map.adjacentCells(i, j)
        .filter(([x, y]) => this.city.map.get(x, y) === ROAD_TILE)
        .forEach(([x, y]) => this.renderRoadTile(x, y));
    });
  }
}


/***/ }),

/***/ "./src/js/modal.js":
/*!*************************!*\
  !*** ./src/js/modal.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Modal)
/* harmony export */ });
class Modal {
  /**
   * @param {object} options
   *  Modal dialog options
   * @param {string} options.title
   *  Dialog title.
   * @param {string} options.size
   *  Modal size (lg or sm).
   * @param {boolean} options.showCloseButton
   *  Shows a close button in the dialog if true.
   * @param {boolean} options.showFooter
   *  Adds a footer area to the dialog if true.
   */
  constructor(options) {
    this.returnValue = null;

    this.$element = $('<div class="modal fade"></div>');
    this.$dialog = $('<div class="modal-dialog"></div>').appendTo(this.$element);
    this.$content = $('<div class="modal-content"></div>').appendTo(this.$dialog);
    this.$header = $('<div class="modal-header"></div>').appendTo(this.$content);
    this.$body = $('<div class="modal-body"></div>').appendTo(this.$content);
    this.$footer = $('<div class="modal-footer"></div>').appendTo(this.$content);

    this.$closeButton = $('<button type="button" class="close" data-dismiss="modal">')
      .append($('<span>&times;</span>'))
      .appendTo(this.$header);

    if (options.title) {
      $('<h5 class="modal-title"></h5>')
        .html(options.title)
        .prependTo(this.$header);
    }
    if (options.size) {
      this.$dialog.addClass(`modal-${options.size}`);
    }

    if (options.showCloseButton === false) {
      this.$closeButton.remove();
    }
    if (options.showFooter === false) {
      this.$footer.remove();
    }
  }

  async show() {
    return new Promise((resolve) => {
      $('body').append(this.$element);
      this.$element.modal();
      this.$element.on('hidden.bs.modal', () => {
        this.$element.remove();
        resolve(this.returnValue);
      });
    });
  }

  hide(returnValue) {
    this.returnValue = returnValue;
    this.$element.modal('hide');
  }
}


/***/ }),

/***/ "./src/js/server-socket-connector.js":
/*!*******************************************!*\
  !*** ./src/js/server-socket-connector.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ServerSocketConnector)
/* harmony export */ });
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events */ "./node_modules/events/events.js");
/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
/* eslint-disable no-console */


const PING_TIME = 1000 * 10;
const PONG_WAIT_TIME = 1000 * 10;
const RECONNECT_TIME = 1000 * 10;

class ServerSocketConnector {
  constructor(uri) {
    this.uri = uri;
    this.ws = null;
    this.connected = false;
    this.events = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
    this.pingTimeout = null;
    this.pongWaitTimeout = null;
    this.reconnectTimeout = null;
    this.connect();
  }

  connect() {
    this.cancelPing();
    this.cancelReconnect();

    console.log(`Connecting to ${this.uri}...`);
    this.ws = new WebSocket(this.uri);
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    // ws.onerror is not handled because the event gives no data about the
    // error, and on a connection failure onclose will be called.

    this.connected = false;
  }

  cancelReconnect() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  reconnect() {
    this.cancelReconnect();
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, RECONNECT_TIME);
    console.log(`Will attempt to reconnect in ${RECONNECT_TIME / 1000} seconds...`);
  }

  handleOpen() {
    this.cancelReconnect();

    this.connected = true;
    console.log('Connected.');
    this.events.emit('connect');
    this.schedulePing();
  }

  handleClose(ev) {
    this.connected = false;
    this.cancelPing();
    // ev.code is defined here https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
    // but according to people the only code one normally gets is 1006 (Abnormal Closure)
    console.log(
      `Disconnected with code ${ev.code}`,
      ev.code === 1006 ? ': Abnormal closure' : '',
      ev.reason ? `(reason: ${ev.reason})` : ''
    );
    this.events.emit('disconnect');
    this.reconnect();
  }

  handleMessage(ev) {
    const message = JSON.parse(ev.data);
    if (message.type === 'map_update') {
      this.events.emit('map_update', message.cells);
    }
    else if (message.type === 'pong') {
      this.handlePong();
    }
  }

  handlePong() {
    this.cancelPongWait();
  }

  send(data) {
    this.cancelPing();
    const message = typeof data === 'string' ? { type: data } : data;
    this.ws.send(JSON.stringify(message));
    this.schedulePing();
  }

  cancelPing() {
    if (this.pingTimeout !== null) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  schedulePing() {
    this.cancelPing();
    this.pingTimeout = setTimeout(() => {
      this.pingTimeout = null;
      this.ping();
    }, PING_TIME);
  }

  cancelPongWait() {
    if (this.pongWaitTimeout !== null) {
      clearTimeout(this.pongWaitTimeout);
      this.pongWaitTimeout = null;
    }
  }

  startPongWait() {
    this.pongWaitTimeout = setTimeout(() => {
      this.pongWaitTimeout = null;
      console.warn(`PONG not received after ${PONG_WAIT_TIME / 1000} seconds`);
      console.warn('Closing connection');
      this.ws.close();
    }, PONG_WAIT_TIME);
  }

  ping() {
    this.send('ping');
    this.startPongWait();
  }

  getMap() {
    this.send('get_map');
  }

  setMap(cells) {
    this.send({
      type: 'set_map',
      cells,
    });
  }
}


/***/ }),

/***/ "./src/js/textures-roads.js":
/*!**********************************!*\
  !*** ./src/js/textures-roads.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _static_tiles_road_0000_png__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../static/tiles/road-0000.png */ "./static/tiles/road-0000.png");
/* harmony import */ var _static_tiles_road_0001_png__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../static/tiles/road-0001.png */ "./static/tiles/road-0001.png");
/* harmony import */ var _static_tiles_road_0010_png__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../static/tiles/road-0010.png */ "./static/tiles/road-0010.png");
/* harmony import */ var _static_tiles_road_0011_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../static/tiles/road-0011.png */ "./static/tiles/road-0011.png");
/* harmony import */ var _static_tiles_road_0100_png__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../static/tiles/road-0100.png */ "./static/tiles/road-0100.png");
/* harmony import */ var _static_tiles_road_0101_png__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../static/tiles/road-0101.png */ "./static/tiles/road-0101.png");
/* harmony import */ var _static_tiles_road_0110_png__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../static/tiles/road-0110.png */ "./static/tiles/road-0110.png");
/* harmony import */ var _static_tiles_road_0111_png__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../static/tiles/road-0111.png */ "./static/tiles/road-0111.png");
/* harmony import */ var _static_tiles_road_1000_png__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../static/tiles/road-1000.png */ "./static/tiles/road-1000.png");
/* harmony import */ var _static_tiles_road_1001_png__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../static/tiles/road-1001.png */ "./static/tiles/road-1001.png");
/* harmony import */ var _static_tiles_road_1010_png__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../static/tiles/road-1010.png */ "./static/tiles/road-1010.png");
/* harmony import */ var _static_tiles_road_1011_png__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../static/tiles/road-1011.png */ "./static/tiles/road-1011.png");
/* harmony import */ var _static_tiles_road_1100_png__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../static/tiles/road-1100.png */ "./static/tiles/road-1100.png");
/* harmony import */ var _static_tiles_road_1101_png__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../static/tiles/road-1101.png */ "./static/tiles/road-1101.png");
/* harmony import */ var _static_tiles_road_1110_png__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../static/tiles/road-1110.png */ "./static/tiles/road-1110.png");
/* harmony import */ var _static_tiles_road_1111_png__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../static/tiles/road-1111.png */ "./static/tiles/road-1111.png");

















const RoadTextures = {
  road0000: _static_tiles_road_0000_png__WEBPACK_IMPORTED_MODULE_0__,
  road0001: _static_tiles_road_0001_png__WEBPACK_IMPORTED_MODULE_1__,
  road0010: _static_tiles_road_0010_png__WEBPACK_IMPORTED_MODULE_2__,
  road0011: _static_tiles_road_0011_png__WEBPACK_IMPORTED_MODULE_3__,
  road0100: _static_tiles_road_0100_png__WEBPACK_IMPORTED_MODULE_4__,
  road0101: _static_tiles_road_0101_png__WEBPACK_IMPORTED_MODULE_5__,
  road0110: _static_tiles_road_0110_png__WEBPACK_IMPORTED_MODULE_6__,
  road0111: _static_tiles_road_0111_png__WEBPACK_IMPORTED_MODULE_7__,
  road1000: _static_tiles_road_1000_png__WEBPACK_IMPORTED_MODULE_8__,
  road1001: _static_tiles_road_1001_png__WEBPACK_IMPORTED_MODULE_9__,
  road1010: _static_tiles_road_1010_png__WEBPACK_IMPORTED_MODULE_10__,
  road1011: _static_tiles_road_1011_png__WEBPACK_IMPORTED_MODULE_11__,
  road1100: _static_tiles_road_1100_png__WEBPACK_IMPORTED_MODULE_12__,
  road1101: _static_tiles_road_1101_png__WEBPACK_IMPORTED_MODULE_13__,
  road1110: _static_tiles_road_1110_png__WEBPACK_IMPORTED_MODULE_14__,
  road1111: _static_tiles_road_1111_png__WEBPACK_IMPORTED_MODULE_15__,
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RoadTextures);


/***/ }),

/***/ "./src/js/variable-view.js":
/*!*********************************!*\
  !*** ./src/js/variable-view.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ VariableView)
/* harmony export */ });
/* globals PIXI */

const TILE_SIZE = 10;

class VariableView {
  constructor(variable) {
    this.displayObject = new PIXI.Container();
    this.variable = variable;

    this.tiles = Array(this.variable.grid.width * this.variable.grid.height);
    this.variable.grid.allCells().forEach(([i, j]) => {
      const newTile = new PIXI.Graphics();
      newTile.x = i * TILE_SIZE;
      newTile.y = j * TILE_SIZE;
      this.tiles[this.variable.grid.offset(i, j)] = newTile;
    });

    this.displayObject.addChild(...this.tiles);
    this.variable.events.on('update', this.handleUpdate.bind(this));
    this.handleUpdate(this.variable.grid.allCells());
  }

  getTile(i, j) {
    return this.tiles[this.variable.grid.offset(i, j)];
  }

  renderTile(i, j) {
    this.getTile(i, j)
      .clear()
      .beginFill(0x953202, this.variable.grid.get(i, j))
      .drawRect(0, 0, TILE_SIZE, TILE_SIZE)
      .endFill();
  }

  handleUpdate(updates) {
    updates.forEach(([i, j]) => {
      this.renderTile(i, j);
    });
  }
}


/***/ }),

/***/ "./static/fa/pencil-alt-solid.svg":
/*!****************************************!*\
  !*** ./static/fa/pencil-alt-solid.svg ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "2174451d87ee3f5a3181.svg";

/***/ }),

/***/ "./static/tiles/road-0000.png":
/*!************************************!*\
  !*** ./static/tiles/road-0000.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "1a8456203b87386408d8.png";

/***/ }),

/***/ "./static/tiles/road-0001.png":
/*!************************************!*\
  !*** ./static/tiles/road-0001.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "84ec50c0265be4befbfc.png";

/***/ }),

/***/ "./static/tiles/road-0010.png":
/*!************************************!*\
  !*** ./static/tiles/road-0010.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "80ee4438210070dfc287.png";

/***/ }),

/***/ "./static/tiles/road-0011.png":
/*!************************************!*\
  !*** ./static/tiles/road-0011.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "4b03a65970e618f9328e.png";

/***/ }),

/***/ "./static/tiles/road-0100.png":
/*!************************************!*\
  !*** ./static/tiles/road-0100.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "da06ed83a3ce0389b676.png";

/***/ }),

/***/ "./static/tiles/road-0101.png":
/*!************************************!*\
  !*** ./static/tiles/road-0101.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "b700faa8ced1ba0f3874.png";

/***/ }),

/***/ "./static/tiles/road-0110.png":
/*!************************************!*\
  !*** ./static/tiles/road-0110.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "3d8c7cc6d5c792dc81bf.png";

/***/ }),

/***/ "./static/tiles/road-0111.png":
/*!************************************!*\
  !*** ./static/tiles/road-0111.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "e8742869d0c8a14848d8.png";

/***/ }),

/***/ "./static/tiles/road-1000.png":
/*!************************************!*\
  !*** ./static/tiles/road-1000.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "4fa20d3ef133f4e628d8.png";

/***/ }),

/***/ "./static/tiles/road-1001.png":
/*!************************************!*\
  !*** ./static/tiles/road-1001.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "99436b515e0c408ed029.png";

/***/ }),

/***/ "./static/tiles/road-1010.png":
/*!************************************!*\
  !*** ./static/tiles/road-1010.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "8d2ad6977fab48071782.png";

/***/ }),

/***/ "./static/tiles/road-1011.png":
/*!************************************!*\
  !*** ./static/tiles/road-1011.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "6c749a80ab22075a538b.png";

/***/ }),

/***/ "./static/tiles/road-1100.png":
/*!************************************!*\
  !*** ./static/tiles/road-1100.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "098caf0e2dfc28b9cd84.png";

/***/ }),

/***/ "./static/tiles/road-1101.png":
/*!************************************!*\
  !*** ./static/tiles/road-1101.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "4856a088fedc150f4e21.png";

/***/ }),

/***/ "./static/tiles/road-1110.png":
/*!************************************!*\
  !*** ./static/tiles/road-1110.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "38dbdfc9a02dd9a47494.png";

/***/ }),

/***/ "./static/tiles/road-1111.png":
/*!************************************!*\
  !*** ./static/tiles/road-1111.png ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "b80a83d5c965a0c18254.png";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/js/main-editor.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _city__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./city */ "./src/js/city.js");
/* harmony import */ var _emissions_variable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./emissions-variable */ "./src/js/emissions-variable.js");
/* harmony import */ var _editor_map_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./editor/map-editor */ "./src/js/editor/map-editor.js");
/* harmony import */ var _variable_view__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./variable-view */ "./src/js/variable-view.js");
/* harmony import */ var _sass_default_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../sass/default.scss */ "./src/sass/default.scss");
/* harmony import */ var _textures_roads__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./textures-roads */ "./src/js/textures-roads.js");
/* harmony import */ var _server_socket_connector__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./server-socket-connector */ "./src/js/server-socket-connector.js");
/* globals PIXI */








fetch(`${"http://localhost:4848"}/config`, { cache: 'no-store' })
  .then(response => response.json())
  .then((config) => {
    // const city = City.fromJSON(Cities.cities[0]);
    const city = new _city__WEBPACK_IMPORTED_MODULE_0__.default(config.cityWidth, config.cityHeight);
    const emissions = new _emissions_variable__WEBPACK_IMPORTED_MODULE_1__.default(city, config);

    const app = new PIXI.Application({
      width: 3840,
      height: 1920,
      backgroundColor: 0xf2f2f2,
    });
    Object.entries(_textures_roads__WEBPACK_IMPORTED_MODULE_5__.default).forEach(([id, path]) => {
      app.loader.add(id, path);
    });
    app.loader.load((loader, resources) => {
      $('[data-component="app-container"]').append(app.view);
      const textures = Object.fromEntries(
        Object.entries(_textures_roads__WEBPACK_IMPORTED_MODULE_5__.default).map(([id]) => [id, resources[id].texture])
      );

      // Change the scaling mode for the road textures
      Object.keys(textures).forEach((id) => {
        textures[id].baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      });

      // const mapView = new MapView(city, config, textures);
      const mapView = new _editor_map_editor__WEBPACK_IMPORTED_MODULE_2__.default($('body'), city, config, textures);
      app.stage.addChild(mapView.displayObject);
      mapView.displayObject.width = 1920;
      mapView.displayObject.height = 1920;
      mapView.displayObject.x = 0;
      mapView.displayObject.y = 0;

      const varViewer = new _variable_view__WEBPACK_IMPORTED_MODULE_3__.default(emissions);
      app.stage.addChild(varViewer.displayObject);
      varViewer.displayObject.width = 960;
      varViewer.displayObject.height = 960;
      varViewer.displayObject.x = 1920 + 40;
      varViewer.displayObject.y = 0;

      const connector = new _server_socket_connector__WEBPACK_IMPORTED_MODULE_6__.default("ws://localhost:4848");
      connector.events.once('map_update', (cells) => {
        city.map.replace(cells);
        city.map.events.on('update', () => {
          connector.setMap(city.map.cells);
        });
      });
      connector.events.on('connect', () => {
        connector.getMap();
      });
    });
  })
  .catch((err) => {
    console.error('Error loading configuration');
    console.error(err);
  });

})();

/******/ })()
;
//# sourceMappingURL=editor.c0edce832aafb2e4dec8.js.map