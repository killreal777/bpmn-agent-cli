#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli/main.ts
var main_exports = {};
__export(main_exports, {
  main: () => main
});
module.exports = __toCommonJS(main_exports);

// src/bpmn/errors.ts
var BpmnCliError = class extends Error {
  constructor(code, message, exitCode, details = {}, suggestions3 = []) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
    this.suggestions = suggestions3;
  }
};

// src/metrics/traceMetrics.ts
var import_node_crypto = require("node:crypto");
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
function estimateTokens(textOrBytes) {
  const length = typeof textOrBytes === "number" ? textOrBytes : Buffer.byteLength(textOrBytes, "utf8");
  return Math.ceil(length / 4);
}
function hash(value) {
  return `sha256:${(0, import_node_crypto.createHash)("sha256").update(value).digest("hex")}`;
}
async function buildTraceMetricsEntry(input) {
  const fileHash = input.file ? hash(await (0, import_promises.readFile)(input.file)) : null;
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    command: input.command,
    fileHash,
    argsHash: hash(input.args.join("\0")),
    durationMs: input.durationMs,
    exitCode: input.exitCode,
    stdoutBytes: input.stdoutBytes,
    estimatedOutputTokens: estimateTokens(input.stdoutBytes),
    errorCode: input.errorCode
  };
}
async function appendTraceMetricsEntry(path, entry) {
  await (0, import_promises.mkdir)((0, import_node_path.dirname)(path), { recursive: true });
  await (0, import_promises.appendFile)(path, `${JSON.stringify(entry)}
`, "utf8");
}

// src/output/jsonOutput.ts
function successEnvelope(args) {
  return {
    ok: true,
    command: args.command,
    file: args.file,
    result: args.result
  };
}
function errorEnvelope(error3) {
  if (error3 instanceof BpmnCliError) {
    return {
      ok: false,
      error: {
        code: error3.code,
        message: error3.message,
        details: error3.details,
        suggestions: error3.suggestions
      }
    };
  }
  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: error3 instanceof Error ? error3.message : String(error3),
      details: {},
      suggestions: []
    }
  };
}
function toExitCode(error3) {
  return error3 instanceof BpmnCliError ? error3.exitCode : 5;
}
function writeJson(value, pretty = false) {
  process.stdout.write(`${JSON.stringify(value, null, pretty ? 2 : 0)}
`);
}

// src/cli/args.ts
function parseArgs(args) {
  const [command, candidateFile, ...rest] = args;
  const options = /* @__PURE__ */ new Map();
  const file = candidateFile && !candidateFile.startsWith("-") ? candidateFile : null;
  const optionArgs = file ? rest : [candidateFile, ...rest].filter((value) => Boolean(value));
  for (let index = 0; index < optionArgs.length; index += 1) {
    const item = optionArgs[index];
    if (!item.startsWith("--") && item !== "-o") {
      continue;
    }
    const next = optionArgs[index + 1];
    if (next && !next.startsWith("-")) {
      options.set(item, next);
      index += 1;
    } else {
      options.set(item, true);
    }
  }
  return { command: command ?? "", file, options };
}

// src/cli/commands/addBoundaryEventCommand.ts
var import_promises3 = require("node:fs/promises");
var import_node_path2 = require("node:path");

// src/bpmn/loadBpmn.ts
var import_promises2 = require("node:fs/promises");

// node_modules/min-dash/dist/index.esm.js
var nativeToString = Object.prototype.toString;
var nativeHasOwnProperty = Object.prototype.hasOwnProperty;
function isUndefined(obj) {
  return obj === void 0;
}
function isDefined(obj) {
  return obj !== void 0;
}
function isNil(obj) {
  return obj == null;
}
function isArray(obj) {
  return nativeToString.call(obj) === "[object Array]";
}
function isObject(obj) {
  return nativeToString.call(obj) === "[object Object]";
}
function isFunction(obj) {
  const tag = nativeToString.call(obj);
  return tag === "[object Function]" || tag === "[object AsyncFunction]" || tag === "[object GeneratorFunction]" || tag === "[object AsyncGeneratorFunction]" || tag === "[object Proxy]";
}
function isString(obj) {
  return nativeToString.call(obj) === "[object String]";
}
function has(target, key) {
  return !isNil(target) && nativeHasOwnProperty.call(target, key);
}
function find(collection, matcher) {
  const matchFn = toMatcher(matcher);
  let match;
  forEach(collection, function(val, key) {
    if (matchFn(val, key)) {
      match = val;
      return false;
    }
  });
  return match;
}
function findIndex(collection, matcher) {
  const matchFn = toMatcher(matcher);
  let idx = isArray(collection) ? -1 : void 0;
  forEach(collection, function(val, key) {
    if (matchFn(val, key)) {
      idx = key;
      return false;
    }
  });
  return idx;
}
function filter(collection, matcher) {
  const matchFn = toMatcher(matcher);
  let result = [];
  forEach(collection, function(val, key) {
    if (matchFn(val, key)) {
      result.push(val);
    }
  });
  return result;
}
function forEach(collection, iterator) {
  let val, result;
  if (isUndefined(collection)) {
    return;
  }
  const convertKey = isArray(collection) ? toNum : identity;
  for (let key in collection) {
    if (has(collection, key)) {
      val = collection[key];
      result = iterator(val, convertKey(key));
      if (result === false) {
        return val;
      }
    }
  }
}
function toMatcher(matcher) {
  return isFunction(matcher) ? matcher : (e) => {
    return e === matcher;
  };
}
function identity(arg) {
  return arg;
}
function toNum(arg) {
  return Number(arg);
}
function bind(fn, target) {
  return fn.bind(target);
}
function assign(target, ...others) {
  return Object.assign(target, ...others);
}
function set(target, path, value) {
  let currentTarget = target;
  forEach(path, function(key, idx) {
    if (typeof key !== "number" && typeof key !== "string") {
      throw new Error("illegal key type: " + typeof key + ". Key should be of type number or string.");
    }
    if (key === "constructor") {
      throw new Error("illegal key: constructor");
    }
    if (key === "__proto__") {
      throw new Error("illegal key: __proto__");
    }
    let nextKey = path[idx + 1];
    let nextTarget = currentTarget[key];
    if (isDefined(nextKey) && isNil(nextTarget)) {
      nextTarget = currentTarget[key] = isNaN(+nextKey) ? {} : [];
    }
    if (isUndefined(nextKey)) {
      if (isUndefined(value)) {
        delete currentTarget[key];
      } else {
        currentTarget[key] = value;
      }
    } else {
      currentTarget = nextTarget;
    }
  });
  return target;
}
function pick(target, properties) {
  let result = {};
  let obj = Object(target);
  forEach(properties, function(prop) {
    if (prop in obj) {
      result[prop] = target[prop];
    }
  });
  return result;
}

// node_modules/moddle/dist/index.js
function Base() {
}
Base.prototype.get = function(name2) {
  return this.$model.properties.get(this, name2);
};
Base.prototype.set = function(name2, value) {
  this.$model.properties.set(this, name2, value);
};
function Factory(model, properties) {
  this.model = model;
  this.properties = properties;
}
Factory.prototype.createType = function(descriptor) {
  var model = this.model;
  var props = this.properties, prototype = Object.create(Base.prototype);
  forEach(descriptor.properties, function(p) {
    if (!p.isMany && p.default !== void 0) {
      prototype[p.name] = p.default;
    }
  });
  props.defineModel(prototype, model);
  props.defineDescriptor(prototype, descriptor);
  var name2 = descriptor.ns.name;
  function ModdleElement(attrs) {
    props.define(this, "$type", { value: name2, enumerable: true });
    props.define(this, "$attrs", { value: {} });
    props.define(this, "$parent", { writable: true });
    forEach(attrs, bind(function(val, key) {
      this.set(key, val);
    }, this));
  }
  ModdleElement.prototype = prototype;
  ModdleElement.hasType = prototype.$instanceOf = this.model.hasType;
  props.defineModel(ModdleElement, model);
  props.defineDescriptor(ModdleElement, descriptor);
  return ModdleElement;
};
var BUILTINS = {
  String: true,
  Boolean: true,
  Integer: true,
  Real: true,
  Element: true
};
var TYPE_CONVERTERS = {
  String: function(s) {
    return s;
  },
  Boolean: function(s) {
    return s === "true";
  },
  Integer: function(s) {
    return parseInt(s, 10);
  },
  Real: function(s) {
    return parseFloat(s);
  }
};
function coerceType(type, value) {
  var converter = TYPE_CONVERTERS[type];
  if (converter) {
    return converter(value);
  } else {
    return value;
  }
}
function isBuiltIn(type) {
  return !!BUILTINS[type];
}
function isSimple(type) {
  return !!TYPE_CONVERTERS[type];
}
function parseName(name2, defaultPrefix) {
  var parts = name2.split(/:/), localName, prefix2;
  if (parts.length === 1) {
    localName = name2;
    prefix2 = defaultPrefix;
  } else if (parts.length === 2) {
    localName = parts[1];
    prefix2 = parts[0];
  } else {
    throw new Error("expected <prefix:localName> or <localName>, got " + name2);
  }
  name2 = (prefix2 ? prefix2 + ":" : "") + localName;
  return {
    name: name2,
    prefix: prefix2,
    localName
  };
}
function DescriptorBuilder(nameNs) {
  this.ns = nameNs;
  this.name = nameNs.name;
  this.allTypes = [];
  this.allTypesByName = {};
  this.properties = [];
  this.propertiesByName = {};
}
DescriptorBuilder.prototype.build = function() {
  return pick(this, [
    "ns",
    "name",
    "allTypes",
    "allTypesByName",
    "properties",
    "propertiesByName",
    "bodyProperty",
    "idProperty"
  ]);
};
DescriptorBuilder.prototype.addProperty = function(p, idx, validate) {
  if (typeof idx === "boolean") {
    validate = idx;
    idx = void 0;
  }
  this.addNamedProperty(p, validate !== false);
  var properties = this.properties;
  if (idx !== void 0) {
    properties.splice(idx, 0, p);
  } else {
    properties.push(p);
  }
};
DescriptorBuilder.prototype.replaceProperty = function(oldProperty, newProperty, replace) {
  var oldNameNs = oldProperty.ns;
  var props = this.properties, propertiesByName = this.propertiesByName, rename = oldProperty.name !== newProperty.name;
  if (oldProperty.isId) {
    if (!newProperty.isId) {
      throw new Error(
        "property <" + newProperty.ns.name + "> must be id property to refine <" + oldProperty.ns.name + ">"
      );
    }
    this.setIdProperty(newProperty, false);
  }
  if (oldProperty.isBody) {
    if (!newProperty.isBody) {
      throw new Error(
        "property <" + newProperty.ns.name + "> must be body property to refine <" + oldProperty.ns.name + ">"
      );
    }
    this.setBodyProperty(newProperty, false);
  }
  var idx = props.indexOf(oldProperty);
  if (idx === -1) {
    throw new Error("property <" + oldNameNs.name + "> not found in property list");
  }
  props.splice(idx, 1);
  this.addProperty(newProperty, replace ? void 0 : idx, rename);
  propertiesByName[oldNameNs.name] = propertiesByName[oldNameNs.localName] = newProperty;
};
DescriptorBuilder.prototype.redefineProperty = function(p, targetPropertyName, replace) {
  var nsPrefix = p.ns.prefix;
  var parts = targetPropertyName.split("#");
  var name2 = parseName(parts[0], nsPrefix);
  var attrName = parseName(parts[1], name2.prefix).name;
  var redefinedProperty = this.propertiesByName[attrName];
  if (!redefinedProperty) {
    throw new Error("refined property <" + attrName + "> not found");
  } else {
    this.replaceProperty(redefinedProperty, p, replace);
  }
  delete p.redefines;
};
DescriptorBuilder.prototype.addNamedProperty = function(p, validate) {
  var ns = p.ns, propsByName = this.propertiesByName;
  if (validate) {
    this.assertNotDefined(p, ns.name);
    this.assertNotDefined(p, ns.localName);
  }
  propsByName[ns.name] = propsByName[ns.localName] = p;
};
DescriptorBuilder.prototype.removeNamedProperty = function(p) {
  var ns = p.ns, propsByName = this.propertiesByName;
  delete propsByName[ns.name];
  delete propsByName[ns.localName];
};
DescriptorBuilder.prototype.setBodyProperty = function(p, validate) {
  if (validate && this.bodyProperty) {
    throw new Error(
      "body property defined multiple times (<" + this.bodyProperty.ns.name + ">, <" + p.ns.name + ">)"
    );
  }
  this.bodyProperty = p;
};
DescriptorBuilder.prototype.setIdProperty = function(p, validate) {
  if (validate && this.idProperty) {
    throw new Error(
      "id property defined multiple times (<" + this.idProperty.ns.name + ">, <" + p.ns.name + ">)"
    );
  }
  this.idProperty = p;
};
DescriptorBuilder.prototype.assertNotTrait = function(typeDescriptor) {
  const _extends = typeDescriptor.extends || [];
  if (_extends.length) {
    throw new Error(
      `cannot create <${typeDescriptor.name}> extending <${typeDescriptor.extends}>`
    );
  }
};
DescriptorBuilder.prototype.assertNotDefined = function(p, name2) {
  var propertyName = p.name, definedProperty = this.propertiesByName[propertyName];
  if (definedProperty) {
    throw new Error(
      "property <" + propertyName + "> already defined; override of <" + definedProperty.definedBy.ns.name + "#" + definedProperty.ns.name + "> by <" + p.definedBy.ns.name + "#" + p.ns.name + "> not allowed without redefines"
    );
  }
};
DescriptorBuilder.prototype.hasProperty = function(name2) {
  return this.propertiesByName[name2];
};
DescriptorBuilder.prototype.addTrait = function(t, inherited) {
  if (inherited) {
    this.assertNotTrait(t);
  }
  var typesByName = this.allTypesByName, types2 = this.allTypes;
  var typeName = t.name;
  if (typeName in typesByName) {
    return;
  }
  forEach(t.properties, bind(function(p) {
    p = assign({}, p, {
      name: p.ns.localName,
      inherited
    });
    Object.defineProperty(p, "definedBy", {
      value: t
    });
    var replaces = p.replaces, redefines = p.redefines;
    if (replaces || redefines) {
      this.redefineProperty(p, replaces || redefines, replaces);
    } else {
      if (p.isBody) {
        this.setBodyProperty(p);
      }
      if (p.isId) {
        this.setIdProperty(p);
      }
      this.addProperty(p);
    }
  }, this));
  types2.push(t);
  typesByName[typeName] = t;
};
function Registry(packages2, properties) {
  this.packageMap = {};
  this.typeMap = {};
  this.packages = [];
  this.properties = properties;
  forEach(packages2, bind(this.registerPackage, this));
}
Registry.prototype.getPackage = function(uriOrPrefix) {
  return this.packageMap[uriOrPrefix];
};
Registry.prototype.getPackages = function() {
  return this.packages;
};
Registry.prototype.registerPackage = function(pkg) {
  pkg = assign({}, pkg);
  var pkgMap = this.packageMap;
  ensureAvailable(pkgMap, pkg, "prefix");
  ensureAvailable(pkgMap, pkg, "uri");
  forEach(pkg.types, bind(function(descriptor) {
    this.registerType(descriptor, pkg);
  }, this));
  pkgMap[pkg.uri] = pkgMap[pkg.prefix] = pkg;
  this.packages.push(pkg);
};
Registry.prototype.registerType = function(type, pkg) {
  type = assign({}, type, {
    superClass: (type.superClass || []).slice(),
    extends: (type.extends || []).slice(),
    properties: (type.properties || []).slice(),
    meta: assign(type.meta || {})
  });
  var ns = parseName(type.name, pkg.prefix), name2 = ns.name, propertiesByName = {};
  forEach(type.properties, bind(function(p) {
    var propertyNs = parseName(p.name, ns.prefix), propertyName = propertyNs.name;
    if (!isBuiltIn(p.type)) {
      p.type = parseName(p.type, propertyNs.prefix).name;
    }
    assign(p, {
      ns: propertyNs,
      name: propertyName
    });
    propertiesByName[propertyName] = p;
  }, this));
  assign(type, {
    ns,
    name: name2,
    propertiesByName
  });
  forEach(type.extends, bind(function(extendsName) {
    var extendsNameNs = parseName(extendsName, ns.prefix);
    var extended = this.typeMap[extendsNameNs.name];
    extended.traits = extended.traits || [];
    extended.traits.push(name2);
  }, this));
  this.definePackage(type, pkg);
  this.typeMap[name2] = type;
};
Registry.prototype.mapTypes = function(nsName2, iterator, trait) {
  var type = isBuiltIn(nsName2.name) ? { name: nsName2.name } : this.typeMap[nsName2.name];
  var self = this;
  function traverse(cls, trait2) {
    var parentNs = parseName(cls, isBuiltIn(cls) ? "" : nsName2.prefix);
    self.mapTypes(parentNs, iterator, trait2);
  }
  function traverseTrait(cls) {
    return traverse(cls, true);
  }
  function traverseSuper(cls) {
    return traverse(cls, false);
  }
  if (!type) {
    throw new Error("unknown type <" + nsName2.name + ">");
  }
  forEach(type.superClass, trait ? traverseTrait : traverseSuper);
  iterator(type, !trait);
  forEach(type.traits, traverseTrait);
};
Registry.prototype.getEffectiveDescriptor = function(name2) {
  var nsName2 = parseName(name2);
  var builder = new DescriptorBuilder(nsName2);
  this.mapTypes(nsName2, function(type, inherited) {
    builder.addTrait(type, inherited);
  });
  var descriptor = builder.build();
  this.definePackage(descriptor, descriptor.allTypes[descriptor.allTypes.length - 1].$pkg);
  return descriptor;
};
Registry.prototype.definePackage = function(target, pkg) {
  this.properties.define(target, "$pkg", { value: pkg });
};
function ensureAvailable(packageMap, pkg, identifierKey) {
  var value = pkg[identifierKey];
  if (value in packageMap) {
    throw new Error("package with " + identifierKey + " <" + value + "> already defined");
  }
}
function Properties(model) {
  this.model = model;
}
Properties.prototype.set = function(target, name2, value) {
  if (!isString(name2) || !name2.length) {
    throw new TypeError("property name must be a non-empty string");
  }
  var property = this.getProperty(target, name2);
  var propertyName = property && property.name;
  if (isUndefined2(value)) {
    if (property) {
      delete target[propertyName];
    } else {
      delete target.$attrs[stripGlobal(name2)];
    }
  } else {
    if (property) {
      if (propertyName in target) {
        target[propertyName] = value;
      } else {
        defineProperty(target, property, value);
      }
    } else {
      target.$attrs[stripGlobal(name2)] = value;
    }
  }
};
Properties.prototype.get = function(target, name2) {
  var property = this.getProperty(target, name2);
  if (!property) {
    return target.$attrs[stripGlobal(name2)];
  }
  var propertyName = property.name;
  if (!target[propertyName] && property.isMany) {
    defineProperty(target, property, []);
  }
  return target[propertyName];
};
Properties.prototype.define = function(target, name2, options) {
  if (!options.writable) {
    var value = options.value;
    options = assign({}, options, {
      get: function() {
        return value;
      }
    });
    delete options.value;
  }
  Object.defineProperty(target, name2, options);
};
Properties.prototype.defineDescriptor = function(target, descriptor) {
  this.define(target, "$descriptor", { value: descriptor });
};
Properties.prototype.defineModel = function(target, model) {
  this.define(target, "$model", { value: model });
};
Properties.prototype.getProperty = function(target, name2) {
  var model = this.model;
  var property = model.getPropertyDescriptor(target, name2);
  if (property) {
    return property;
  }
  if (name2.includes(":")) {
    return null;
  }
  const strict = model.config.strict;
  if (typeof strict !== "undefined") {
    const error3 = new TypeError(`unknown property <${name2}> on <${target.$type}>`);
    if (strict) {
      throw error3;
    } else {
      typeof console !== "undefined" && console.warn(error3);
    }
  }
  return null;
};
function isUndefined2(val) {
  return typeof val === "undefined";
}
function defineProperty(target, property, value) {
  Object.defineProperty(target, property.name, {
    enumerable: !property.isReference,
    writable: true,
    value,
    configurable: true
  });
}
function stripGlobal(name2) {
  return name2.replace(/^:/, "");
}
function Moddle(packages2, config = {}) {
  this.properties = new Properties(this);
  this.factory = new Factory(this, this.properties);
  this.registry = new Registry(packages2, this.properties);
  this.typeCache = {};
  this.config = config;
}
Moddle.prototype.create = function(descriptor, attrs) {
  var Type = this.getType(descriptor);
  if (!Type) {
    throw new Error("unknown type <" + descriptor + ">");
  }
  return new Type(attrs);
};
Moddle.prototype.getType = function(descriptor) {
  var cache = this.typeCache;
  var name2 = isString(descriptor) ? descriptor : descriptor.ns.name;
  var type = cache[name2];
  if (!type) {
    descriptor = this.registry.getEffectiveDescriptor(name2);
    type = cache[name2] = this.factory.createType(descriptor);
  }
  return type;
};
Moddle.prototype.createAny = function(name2, nsUri, properties) {
  var nameNs = parseName(name2);
  var element = {
    $type: name2,
    $instanceOf: function(type) {
      return type === this.$type;
    },
    get: function(key) {
      return this[key];
    },
    set: function(key, value) {
      set(this, [key], value);
    }
  };
  var descriptor = {
    name: name2,
    isGeneric: true,
    ns: {
      prefix: nameNs.prefix,
      localName: nameNs.localName,
      uri: nsUri
    }
  };
  this.properties.defineDescriptor(element, descriptor);
  this.properties.defineModel(element, this);
  this.properties.define(element, "get", { enumerable: false, writable: true });
  this.properties.define(element, "set", { enumerable: false, writable: true });
  this.properties.define(element, "$parent", { enumerable: false, writable: true });
  this.properties.define(element, "$instanceOf", { enumerable: false, writable: true });
  forEach(properties, function(a, key) {
    if (isObject(a) && a.value !== void 0) {
      element[a.name] = a.value;
    } else {
      element[key] = a;
    }
  });
  return element;
};
Moddle.prototype.getPackage = function(uriOrPrefix) {
  return this.registry.getPackage(uriOrPrefix);
};
Moddle.prototype.getPackages = function() {
  return this.registry.getPackages();
};
Moddle.prototype.getElementDescriptor = function(element) {
  return element.$descriptor;
};
Moddle.prototype.hasType = function(element, type) {
  if (type === void 0) {
    type = element;
    element = this;
  }
  var descriptor = element.$model.getElementDescriptor(element);
  return type in descriptor.allTypesByName;
};
Moddle.prototype.getPropertyDescriptor = function(element, property) {
  return this.getElementDescriptor(element).propertiesByName[property];
};
Moddle.prototype.getTypeDescriptor = function(type) {
  return this.registry.typeMap[type];
};

// node_modules/saxen/dist/index.js
var fromCharCode = String.fromCharCode;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var ENTITY_PATTERN = /&#(\d+);|&#x([0-9a-f]+);|&(\w+);/ig;
var ENTITY_MAPPING = {
  "amp": "&",
  "apos": "'",
  "gt": ">",
  "lt": "<",
  "quot": '"'
};
Object.keys(ENTITY_MAPPING).forEach(function(k) {
  ENTITY_MAPPING[k.toUpperCase()] = ENTITY_MAPPING[k];
});
function replaceEntities(_, d, x, z) {
  if (z) {
    if (hasOwnProperty.call(ENTITY_MAPPING, z)) {
      return ENTITY_MAPPING[z];
    } else {
      return "&" + z + ";";
    }
  }
  if (d) {
    return fromCharCode(d);
  }
  return fromCharCode(parseInt(x, 16));
}
function decodeEntities(s) {
  if (s.length > 3 && s.indexOf("&") !== -1) {
    return s.replace(ENTITY_PATTERN, replaceEntities);
  }
  return s;
}
var NON_WHITESPACE_OUTSIDE_ROOT_NODE = "non-whitespace outside of root node";
function error(msg) {
  return new Error(msg);
}
function missingNamespaceForPrefix(prefix2) {
  return "missing namespace for prefix <" + prefix2 + ">";
}
function getter(getFn) {
  return {
    "get": getFn,
    "enumerable": true
  };
}
function cloneNsMatrix(nsMatrix) {
  var clone = {}, key;
  for (key in nsMatrix) {
    clone[key] = nsMatrix[key];
  }
  return clone;
}
function uriPrefix(prefix2) {
  return prefix2 + "$uri";
}
function buildNsMatrix(nsUriToPrefix) {
  var nsMatrix = {}, uri2, prefix2;
  for (uri2 in nsUriToPrefix) {
    prefix2 = nsUriToPrefix[uri2];
    nsMatrix[prefix2] = prefix2;
    nsMatrix[uriPrefix(prefix2)] = uri2;
  }
  return nsMatrix;
}
function noopGetContext() {
  return { line: 0, column: 0 };
}
function throwFunc(err) {
  throw err;
}
function Parser(options) {
  if (!this) {
    return new Parser(options);
  }
  var proxy = options && options["proxy"];
  var onText, onOpenTag, onCloseTag, onCDATA, onError = throwFunc, onWarning, onComment, onQuestion, onAttention;
  var getContext2 = noopGetContext;
  var maybeNS = false;
  var isNamespace = false;
  var returnError = null;
  var parseStop = false;
  var nsUriToPrefix;
  function handleError(err) {
    if (!(err instanceof Error)) {
      err = error(err);
    }
    returnError = err;
    onError(err, getContext2);
  }
  function handleWarning(err) {
    if (!onWarning) {
      return;
    }
    if (!(err instanceof Error)) {
      err = error(err);
    }
    onWarning(err, getContext2);
  }
  this["on"] = function(name2, cb) {
    if (typeof cb !== "function") {
      throw error("required args <name, cb>");
    }
    switch (name2) {
      case "openTag":
        onOpenTag = cb;
        break;
      case "text":
        onText = cb;
        break;
      case "closeTag":
        onCloseTag = cb;
        break;
      case "error":
        onError = cb;
        break;
      case "warn":
        onWarning = cb;
        break;
      case "cdata":
        onCDATA = cb;
        break;
      case "attention":
        onAttention = cb;
        break;
      // <!XXXXX zzzz="eeee">
      case "question":
        onQuestion = cb;
        break;
      // <? ....  ?>
      case "comment":
        onComment = cb;
        break;
      default:
        throw error("unsupported event: " + name2);
    }
    return this;
  };
  this["ns"] = function(nsMap) {
    if (typeof nsMap === "undefined") {
      nsMap = {};
    }
    if (typeof nsMap !== "object") {
      throw error("required args <nsMap={}>");
    }
    var _nsUriToPrefix = {}, k;
    for (k in nsMap) {
      _nsUriToPrefix[k] = nsMap[k];
    }
    isNamespace = true;
    nsUriToPrefix = _nsUriToPrefix;
    return this;
  };
  this["parse"] = function(xml2) {
    if (typeof xml2 !== "string") {
      throw error("required args <xml=string>");
    }
    returnError = null;
    parse(xml2);
    getContext2 = noopGetContext;
    parseStop = false;
    return returnError;
  };
  this["stop"] = function() {
    parseStop = true;
  };
  function parse(xml2) {
    var nsMatrixStack = isNamespace ? [] : null, nsMatrix = isNamespace ? buildNsMatrix(nsUriToPrefix) : null, _nsMatrix, nodeStack = [], anonymousNsCount = 0, tagStart = false, tagEnd = false, i = 0, j = 0, x, y, q, w, v, xmlns, elementName, _elementName, elementProxy;
    var attrsString = "", attrsStart = 0, cachedAttrs;
    function getAttrs() {
      if (cachedAttrs !== null) {
        return cachedAttrs;
      }
      var nsUri, nsUriPrefix, nsName2, defaultAlias = isNamespace && nsMatrix["xmlns"], attrList = isNamespace && maybeNS ? [] : null, i2 = attrsStart, s = attrsString, l = s.length, hasNewMatrix, newalias, value, alias, name2, attrs = {}, seenAttrs = {}, skipAttr, w2, j2;
      parseAttr:
        for (; i2 < l; i2++) {
          skipAttr = false;
          w2 = s.charCodeAt(i2);
          if (w2 === 32 || w2 < 14 && w2 > 8) {
            continue;
          }
          if (w2 < 65 || w2 > 122 || w2 > 90 && w2 < 97) {
            if (w2 !== 95 && w2 !== 58) {
              handleWarning("illegal first char attribute name");
              skipAttr = true;
            }
          }
          for (j2 = i2 + 1; j2 < l; j2++) {
            w2 = s.charCodeAt(j2);
            if (w2 > 96 && w2 < 123 || w2 > 64 && w2 < 91 || w2 > 47 && w2 < 59 || w2 === 46 || // '.'
            w2 === 45 || // '-'
            w2 === 95) {
              continue;
            }
            if (w2 === 32 || w2 < 14 && w2 > 8) {
              handleWarning("missing attribute value");
              i2 = j2;
              continue parseAttr;
            }
            if (w2 === 61) {
              break;
            }
            handleWarning("illegal attribute name char");
            skipAttr = true;
          }
          name2 = s.substring(i2, j2);
          if (name2 === "xmlns:xmlns") {
            handleWarning("illegal declaration of xmlns");
            skipAttr = true;
          }
          w2 = s.charCodeAt(j2 + 1);
          if (w2 === 34) {
            j2 = s.indexOf('"', i2 = j2 + 2);
            if (j2 === -1) {
              j2 = s.indexOf("'", i2);
              if (j2 !== -1) {
                handleWarning("attribute value quote missmatch");
                skipAttr = true;
              }
            }
          } else if (w2 === 39) {
            j2 = s.indexOf("'", i2 = j2 + 2);
            if (j2 === -1) {
              j2 = s.indexOf('"', i2);
              if (j2 !== -1) {
                handleWarning("attribute value quote missmatch");
                skipAttr = true;
              }
            }
          } else {
            handleWarning("missing attribute value quotes");
            skipAttr = true;
            for (j2 = j2 + 1; j2 < l; j2++) {
              w2 = s.charCodeAt(j2 + 1);
              if (w2 === 32 || w2 < 14 && w2 > 8) {
                break;
              }
            }
          }
          if (j2 === -1) {
            handleWarning("missing closing quotes");
            j2 = l;
            skipAttr = true;
          }
          if (!skipAttr) {
            value = s.substring(i2, j2);
          }
          i2 = j2;
          for (; j2 + 1 < l; j2++) {
            w2 = s.charCodeAt(j2 + 1);
            if (w2 === 32 || w2 < 14 && w2 > 8) {
              break;
            }
            if (i2 === j2) {
              handleWarning("illegal character after attribute end");
              skipAttr = true;
            }
          }
          i2 = j2 + 1;
          if (skipAttr) {
            continue parseAttr;
          }
          if (name2 in seenAttrs) {
            handleWarning("attribute <" + name2 + "> already defined");
            continue;
          }
          seenAttrs[name2] = true;
          if (!isNamespace) {
            attrs[name2] = value;
            continue;
          }
          if (maybeNS) {
            newalias = name2 === "xmlns" ? "xmlns" : name2.charCodeAt(0) === 120 && name2.substr(0, 6) === "xmlns:" ? name2.substr(6) : null;
            if (newalias !== null) {
              nsUri = decodeEntities(value);
              nsUriPrefix = uriPrefix(newalias);
              alias = nsUriToPrefix[nsUri];
              if (!alias) {
                if (newalias === "xmlns" || nsUriPrefix in nsMatrix && nsMatrix[nsUriPrefix] !== nsUri) {
                  do {
                    alias = "ns" + anonymousNsCount++;
                  } while (typeof nsMatrix[alias] !== "undefined");
                } else {
                  alias = newalias;
                }
                nsUriToPrefix[nsUri] = alias;
              }
              if (nsMatrix[newalias] !== alias) {
                if (!hasNewMatrix) {
                  nsMatrix = cloneNsMatrix(nsMatrix);
                  hasNewMatrix = true;
                }
                nsMatrix[newalias] = alias;
                if (newalias === "xmlns") {
                  nsMatrix[uriPrefix(alias)] = nsUri;
                  defaultAlias = alias;
                }
                nsMatrix[nsUriPrefix] = nsUri;
              }
              attrs[name2] = value;
              continue;
            }
            attrList.push(name2, value);
            continue;
          }
          w2 = name2.indexOf(":");
          if (w2 === -1) {
            attrs[name2] = value;
            continue;
          }
          if (!(nsName2 = nsMatrix[name2.substring(0, w2)])) {
            handleWarning(missingNamespaceForPrefix(name2.substring(0, w2)));
            continue;
          }
          name2 = defaultAlias === nsName2 ? name2.substr(w2 + 1) : nsName2 + name2.substr(w2);
          attrs[name2] = value;
        }
      if (maybeNS) {
        for (i2 = 0, l = attrList.length; i2 < l; i2++) {
          name2 = attrList[i2++];
          value = attrList[i2];
          w2 = name2.indexOf(":");
          if (w2 !== -1) {
            if (!(nsName2 = nsMatrix[name2.substring(0, w2)])) {
              handleWarning(missingNamespaceForPrefix(name2.substring(0, w2)));
              continue;
            }
            name2 = defaultAlias === nsName2 ? name2.substr(w2 + 1) : nsName2 + name2.substr(w2);
          }
          attrs[name2] = value;
        }
      }
      return cachedAttrs = attrs;
    }
    function getParseContext() {
      var splitsRe = /(\r\n|\r|\n)/g;
      var line = 0;
      var column = 0;
      var startOfLine = 0;
      var endOfLine = j;
      var match;
      var data;
      while (i >= startOfLine) {
        match = splitsRe.exec(xml2);
        if (!match) {
          break;
        }
        endOfLine = match[0].length + match.index;
        if (endOfLine > i) {
          break;
        }
        line += 1;
        startOfLine = endOfLine;
      }
      if (i == -1) {
        column = endOfLine;
        data = xml2.substring(j);
      } else if (j === 0) {
        data = xml2.substring(j, i);
      } else {
        column = i - startOfLine;
        data = j == -1 ? xml2.substring(i) : xml2.substring(i, j + 1);
      }
      return {
        "data": data,
        "line": line,
        "column": column
      };
    }
    getContext2 = getParseContext;
    if (proxy) {
      elementProxy = Object.create({}, {
        "name": getter(function() {
          return elementName;
        }),
        "originalName": getter(function() {
          return _elementName;
        }),
        "attrs": getter(getAttrs),
        "ns": getter(function() {
          return nsMatrix;
        })
      });
    }
    while (j !== -1) {
      if (xml2.charCodeAt(j) === 60) {
        i = j;
      } else {
        i = xml2.indexOf("<", j);
      }
      if (i === -1) {
        if (nodeStack.length) {
          return handleError("unexpected end of file");
        }
        if (j === 0) {
          return handleError("missing start tag");
        }
        if (j < xml2.length) {
          if (xml2.substring(j).trim()) {
            handleWarning(NON_WHITESPACE_OUTSIDE_ROOT_NODE);
          }
        }
        return;
      }
      if (j !== i) {
        if (nodeStack.length) {
          if (onText) {
            onText(xml2.substring(j, i), decodeEntities, getContext2);
            if (parseStop) {
              return;
            }
          }
        } else {
          if (xml2.substring(j, i).trim()) {
            handleWarning(NON_WHITESPACE_OUTSIDE_ROOT_NODE);
            if (parseStop) {
              return;
            }
          }
        }
      }
      w = xml2.charCodeAt(i + 1);
      if (w === 33) {
        q = xml2.charCodeAt(i + 2);
        if (q === 91 && xml2.substr(i + 3, 6) === "CDATA[") {
          j = xml2.indexOf("]]>", i);
          if (j === -1) {
            return handleError("unclosed cdata");
          }
          if (onCDATA) {
            onCDATA(xml2.substring(i + 9, j), getContext2);
            if (parseStop) {
              return;
            }
          }
          j += 3;
          continue;
        }
        if (q === 45 && xml2.charCodeAt(i + 3) === 45) {
          j = xml2.indexOf("-->", i);
          if (j === -1) {
            return handleError("unclosed comment");
          }
          if (onComment) {
            onComment(xml2.substring(i + 4, j), decodeEntities, getContext2);
            if (parseStop) {
              return;
            }
          }
          j += 3;
          continue;
        }
      }
      if (w === 63) {
        j = xml2.indexOf("?>", i);
        if (j === -1) {
          return handleError("unclosed question");
        }
        if (onQuestion) {
          onQuestion(xml2.substring(i, j + 2), getContext2);
          if (parseStop) {
            return;
          }
        }
        j += 2;
        continue;
      }
      for (x = i + 1; ; x++) {
        v = xml2.charCodeAt(x);
        if (isNaN(v)) {
          j = -1;
          return handleError("unclosed tag");
        }
        if (v === 34) {
          q = xml2.indexOf('"', x + 1);
          x = q !== -1 ? q : x;
        } else if (v === 39) {
          q = xml2.indexOf("'", x + 1);
          x = q !== -1 ? q : x;
        } else if (v === 62) {
          j = x;
          break;
        }
      }
      if (w === 33) {
        if (onAttention) {
          onAttention(xml2.substring(i, j + 1), decodeEntities, getContext2);
          if (parseStop) {
            return;
          }
        }
        j += 1;
        continue;
      }
      cachedAttrs = {};
      if (w === 47) {
        tagStart = false;
        tagEnd = true;
        if (!nodeStack.length) {
          return handleError("missing open tag");
        }
        x = elementName = nodeStack.pop();
        q = i + 2 + x.length;
        if (xml2.substring(i + 2, q) !== x) {
          return handleError("closing tag mismatch");
        }
        for (; q < j; q++) {
          w = xml2.charCodeAt(q);
          if (w === 32 || w > 8 && w < 14) {
            continue;
          }
          return handleError("close tag");
        }
      } else {
        if (xml2.charCodeAt(j - 1) === 47) {
          x = elementName = xml2.substring(i + 1, j - 1);
          tagStart = true;
          tagEnd = true;
        } else {
          x = elementName = xml2.substring(i + 1, j);
          tagStart = true;
          tagEnd = false;
        }
        if (!(w > 96 && w < 123 || w > 64 && w < 91 || w === 95 || w === 58)) {
          return handleError("illegal first char nodeName");
        }
        for (q = 1, y = x.length; q < y; q++) {
          w = x.charCodeAt(q);
          if (w > 96 && w < 123 || w > 64 && w < 91 || w > 47 && w < 59 || w === 45 || w === 95 || w == 46) {
            continue;
          }
          if (w === 32 || w < 14 && w > 8) {
            elementName = x.substring(0, q);
            cachedAttrs = null;
            break;
          }
          return handleError("invalid nodeName");
        }
        if (!tagEnd) {
          nodeStack.push(elementName);
        }
      }
      if (isNamespace) {
        _nsMatrix = nsMatrix;
        if (tagStart) {
          if (!tagEnd) {
            nsMatrixStack.push(_nsMatrix);
          }
          if (cachedAttrs === null) {
            if (maybeNS = x.indexOf("xmlns", q) !== -1) {
              attrsStart = q;
              attrsString = x;
              getAttrs();
              maybeNS = false;
            }
          }
        }
        _elementName = elementName;
        w = elementName.indexOf(":");
        if (w !== -1) {
          xmlns = nsMatrix[elementName.substring(0, w)];
          if (!xmlns) {
            return handleError("missing namespace on <" + _elementName + ">");
          }
          elementName = elementName.substr(w + 1);
        } else {
          xmlns = nsMatrix["xmlns"];
        }
        if (xmlns) {
          elementName = xmlns + ":" + elementName;
        }
      }
      if (tagStart) {
        attrsStart = q;
        attrsString = x;
        if (onOpenTag) {
          if (proxy) {
            onOpenTag(elementProxy, decodeEntities, tagEnd, getContext2);
          } else {
            onOpenTag(elementName, getAttrs, decodeEntities, tagEnd, getContext2);
          }
          if (parseStop) {
            return;
          }
        }
      }
      if (tagEnd) {
        if (onCloseTag) {
          onCloseTag(proxy ? elementProxy : elementName, decodeEntities, tagStart, getContext2);
          if (parseStop) {
            return;
          }
        }
        if (isNamespace) {
          if (!tagStart) {
            nsMatrix = nsMatrixStack.pop();
          } else {
            nsMatrix = _nsMatrix;
          }
        }
      }
      j += 1;
    }
  }
}

// node_modules/moddle-xml/dist/index.js
function hasLowerCaseAlias(pkg) {
  return pkg.xml && pkg.xml.tagAlias === "lowerCase";
}
var DEFAULT_NS_MAP = {
  "xsi": "http://www.w3.org/2001/XMLSchema-instance",
  "xml": "http://www.w3.org/XML/1998/namespace"
};
var SERIALIZE_PROPERTY = "property";
function getSerialization(element) {
  return element.xml && element.xml.serialize;
}
function getSerializationType(element) {
  const type = getSerialization(element);
  return type !== SERIALIZE_PROPERTY && (type || null);
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function aliasToName(aliasNs, pkg) {
  if (!hasLowerCaseAlias(pkg)) {
    return aliasNs.name;
  }
  return aliasNs.prefix + ":" + capitalize(aliasNs.localName);
}
function prefixedToName(nameNs, pkg) {
  var name2 = nameNs.name, localName = nameNs.localName;
  var typePrefix = pkg && pkg.xml && pkg.xml.typePrefix;
  if (typePrefix && localName.indexOf(typePrefix) === 0) {
    return nameNs.prefix + ":" + localName.slice(typePrefix.length);
  } else {
    return name2;
  }
}
function normalizeTypeName(name2, nsMap, model) {
  const nameNs = parseName(name2, nsMap.xmlns);
  const normalizedName = `${nsMap[nameNs.prefix] || nameNs.prefix}:${nameNs.localName}`;
  const normalizedNameNs = parseName(normalizedName);
  var pkg = model.getPackage(normalizedNameNs.prefix);
  return prefixedToName(normalizedNameNs, pkg);
}
function error2(message) {
  return new Error(message);
}
function getModdleDescriptor(element) {
  return element.$descriptor;
}
function Context(options) {
  assign(this, options);
  this.elementsById = {};
  this.references = [];
  this.warnings = [];
  this.addReference = function(reference) {
    this.references.push(reference);
  };
  this.addElement = function(element) {
    if (!element) {
      throw error2("expected element");
    }
    var elementsById = this.elementsById;
    var descriptor = getModdleDescriptor(element);
    var idProperty = descriptor.idProperty, id;
    if (idProperty) {
      id = element.get(idProperty.name);
      if (id) {
        if (!/^([a-z][\w-.]*:)?[a-z_][\w-.]*$/i.test(id)) {
          throw new Error("illegal ID <" + id + ">");
        }
        if (elementsById[id]) {
          throw error2("duplicate ID <" + id + ">");
        }
        elementsById[id] = element;
      }
    }
  };
  this.addWarning = function(warning) {
    this.warnings.push(warning);
  };
}
function BaseHandler() {
}
BaseHandler.prototype.handleEnd = function() {
};
BaseHandler.prototype.handleText = function() {
};
BaseHandler.prototype.handleNode = function() {
};
function NoopHandler() {
}
NoopHandler.prototype = Object.create(BaseHandler.prototype);
NoopHandler.prototype.handleNode = function() {
  return this;
};
function BodyHandler() {
}
BodyHandler.prototype = Object.create(BaseHandler.prototype);
BodyHandler.prototype.handleText = function(text) {
  this.body = (this.body || "") + text;
};
function ReferenceHandler(property, context) {
  this.property = property;
  this.context = context;
}
ReferenceHandler.prototype = Object.create(BodyHandler.prototype);
ReferenceHandler.prototype.handleNode = function(node) {
  if (this.element) {
    throw error2("expected no sub nodes");
  } else {
    this.element = this.createReference(node);
  }
  return this;
};
ReferenceHandler.prototype.handleEnd = function() {
  this.element.id = this.body;
};
ReferenceHandler.prototype.createReference = function(node) {
  return {
    property: this.property.ns.name,
    id: ""
  };
};
function ValueHandler(propertyDesc, element) {
  this.element = element;
  this.propertyDesc = propertyDesc;
}
ValueHandler.prototype = Object.create(BodyHandler.prototype);
ValueHandler.prototype.handleEnd = function() {
  var value = this.body || "", element = this.element, propertyDesc = this.propertyDesc;
  value = coerceType(propertyDesc.type, value);
  if (propertyDesc.isMany) {
    element.get(propertyDesc.name).push(value);
  } else {
    element.set(propertyDesc.name, value);
  }
};
function BaseElementHandler() {
}
BaseElementHandler.prototype = Object.create(BodyHandler.prototype);
BaseElementHandler.prototype.handleNode = function(node) {
  var parser = this, element = this.element;
  if (!element) {
    element = this.element = this.createElement(node);
    this.context.addElement(element);
  } else {
    parser = this.handleChild(node);
  }
  return parser;
};
function ElementHandler(model, typeName, context) {
  this.model = model;
  this.type = model.getType(typeName);
  this.context = context;
}
ElementHandler.prototype = Object.create(BaseElementHandler.prototype);
ElementHandler.prototype.addReference = function(reference) {
  this.context.addReference(reference);
};
ElementHandler.prototype.handleText = function(text) {
  var element = this.element, descriptor = getModdleDescriptor(element), bodyProperty = descriptor.bodyProperty;
  if (!bodyProperty) {
    throw error2("unexpected body text <" + text + ">");
  }
  BodyHandler.prototype.handleText.call(this, text);
};
ElementHandler.prototype.handleEnd = function() {
  var value = this.body, element = this.element, descriptor = getModdleDescriptor(element), bodyProperty = descriptor.bodyProperty;
  if (bodyProperty && value !== void 0) {
    value = coerceType(bodyProperty.type, value);
    element.set(bodyProperty.name, value);
  }
};
ElementHandler.prototype.createElement = function(node) {
  var attributes = node.attributes, Type = this.type, descriptor = getModdleDescriptor(Type), context = this.context, instance = new Type({}), model = this.model, propNameNs;
  forEach(attributes, function(value, name2) {
    var prop = descriptor.propertiesByName[name2], values;
    if (prop && prop.isReference) {
      if (!prop.isMany) {
        context.addReference({
          element: instance,
          property: prop.ns.name,
          id: value
        });
      } else {
        values = value.split(" ");
        forEach(values, function(v) {
          context.addReference({
            element: instance,
            property: prop.ns.name,
            id: v
          });
        });
      }
    } else {
      if (prop) {
        value = coerceType(prop.type, value);
      } else if (name2 === "xmlns") {
        name2 = ":" + name2;
      } else {
        propNameNs = parseName(name2, descriptor.ns.prefix);
        if (model.getPackage(propNameNs.prefix)) {
          context.addWarning({
            message: "unknown attribute <" + name2 + ">",
            element: instance,
            property: name2,
            value
          });
        }
      }
      instance.set(name2, value);
    }
  });
  return instance;
};
ElementHandler.prototype.getPropertyForNode = function(node) {
  var name2 = node.name;
  var nameNs = parseName(name2);
  var type = this.type, model = this.model, descriptor = getModdleDescriptor(type);
  var propertyName = nameNs.name, property = descriptor.propertiesByName[propertyName];
  if (property && !property.isAttr) {
    const serializationType = getSerializationType(property);
    if (serializationType) {
      const elementTypeName = node.attributes[serializationType];
      if (elementTypeName) {
        const normalizedTypeName = normalizeTypeName(elementTypeName, node.ns, model);
        const elementType = model.getType(normalizedTypeName);
        return assign({}, property, {
          effectiveType: getModdleDescriptor(elementType).name
        });
      }
    }
    return property;
  }
  var pkg = model.getPackage(nameNs.prefix);
  if (pkg) {
    const elementTypeName = aliasToName(nameNs, pkg);
    const elementType = model.getType(elementTypeName);
    property = find(descriptor.properties, function(p) {
      return !p.isVirtual && !p.isReference && !p.isAttribute && elementType.hasType(p.type);
    });
    if (property) {
      return assign({}, property, {
        effectiveType: getModdleDescriptor(elementType).name
      });
    }
  } else {
    property = find(descriptor.properties, function(p) {
      return !p.isReference && !p.isAttribute && p.type === "Element";
    });
    if (property) {
      return property;
    }
  }
  throw error2("unrecognized element <" + nameNs.name + ">");
};
ElementHandler.prototype.toString = function() {
  return "ElementDescriptor[" + getModdleDescriptor(this.type).name + "]";
};
ElementHandler.prototype.valueHandler = function(propertyDesc, element) {
  return new ValueHandler(propertyDesc, element);
};
ElementHandler.prototype.referenceHandler = function(propertyDesc) {
  return new ReferenceHandler(propertyDesc, this.context);
};
ElementHandler.prototype.handler = function(type) {
  if (type === "Element") {
    return new GenericElementHandler(this.model, type, this.context);
  } else {
    return new ElementHandler(this.model, type, this.context);
  }
};
ElementHandler.prototype.handleChild = function(node) {
  var propertyDesc, type, element, childHandler;
  propertyDesc = this.getPropertyForNode(node);
  element = this.element;
  type = propertyDesc.effectiveType || propertyDesc.type;
  if (isSimple(type)) {
    return this.valueHandler(propertyDesc, element);
  }
  if (propertyDesc.isReference) {
    childHandler = this.referenceHandler(propertyDesc).handleNode(node);
  } else {
    childHandler = this.handler(type).handleNode(node);
  }
  var newElement = childHandler.element;
  if (newElement !== void 0) {
    if (propertyDesc.isMany) {
      element.get(propertyDesc.name).push(newElement);
    } else {
      element.set(propertyDesc.name, newElement);
    }
    if (propertyDesc.isReference) {
      assign(newElement, {
        element
      });
      this.context.addReference(newElement);
    } else {
      newElement.$parent = element;
    }
  }
  return childHandler;
};
function RootElementHandler(model, typeName, context) {
  ElementHandler.call(this, model, typeName, context);
}
RootElementHandler.prototype = Object.create(ElementHandler.prototype);
RootElementHandler.prototype.createElement = function(node) {
  var name2 = node.name, nameNs = parseName(name2), model = this.model, type = this.type, pkg = model.getPackage(nameNs.prefix), typeName = pkg && aliasToName(nameNs, pkg) || name2;
  if (!type.hasType(typeName)) {
    throw error2("unexpected element <" + node.originalName + ">");
  }
  return ElementHandler.prototype.createElement.call(this, node);
};
function GenericElementHandler(model, typeName, context) {
  this.model = model;
  this.context = context;
}
GenericElementHandler.prototype = Object.create(BaseElementHandler.prototype);
GenericElementHandler.prototype.createElement = function(node) {
  var name2 = node.name, ns = parseName(name2), prefix2 = ns.prefix, uri2 = node.ns[prefix2 + "$uri"], attributes = node.attributes;
  return this.model.createAny(name2, uri2, attributes);
};
GenericElementHandler.prototype.handleChild = function(node) {
  var handler = new GenericElementHandler(this.model, "Element", this.context).handleNode(node), element = this.element;
  var newElement = handler.element, children;
  if (newElement !== void 0) {
    children = element.$children = element.$children || [];
    children.push(newElement);
    newElement.$parent = element;
  }
  return handler;
};
GenericElementHandler.prototype.handleEnd = function() {
  if (this.body) {
    this.element.$body = this.body;
  }
};
function Reader(options) {
  if (options instanceof Moddle) {
    options = {
      model: options
    };
  }
  assign(this, { lax: false }, options);
}
Reader.prototype.fromXML = function(xml2, options, done) {
  var rootHandler = options.rootHandler;
  if (options instanceof ElementHandler) {
    rootHandler = options;
    options = {};
  } else {
    if (typeof options === "string") {
      rootHandler = this.handler(options);
      options = {};
    } else if (typeof rootHandler === "string") {
      rootHandler = this.handler(rootHandler);
    }
  }
  var model = this.model, lax = this.lax;
  var context = new Context(assign({}, options, { rootHandler })), parser = new Parser({ proxy: true }), stack = createStack();
  rootHandler.context = context;
  stack.push(rootHandler);
  function handleError(err, getContext2, lax2) {
    var ctx = getContext2();
    var line = ctx.line, column = ctx.column, data = ctx.data;
    if (data.charAt(0) === "<" && data.indexOf(" ") !== -1) {
      data = data.slice(0, data.indexOf(" ")) + ">";
    }
    var message = "unparsable content " + (data ? data + " " : "") + "detected\n	line: " + line + "\n	column: " + column + "\n	nested error: " + err.message;
    if (lax2) {
      context.addWarning({
        message,
        error: err
      });
      return true;
    } else {
      throw error2(message);
    }
  }
  function handleWarning(err, getContext2) {
    return handleError(err, getContext2, true);
  }
  function resolveReferences() {
    var elementsById = context.elementsById;
    var references = context.references;
    var i, r;
    for (i = 0; r = references[i]; i++) {
      var element = r.element;
      var reference = elementsById[r.id];
      var property = getModdleDescriptor(element).propertiesByName[r.property];
      if (!reference) {
        context.addWarning({
          message: "unresolved reference <" + r.id + ">",
          element: r.element,
          property: r.property,
          value: r.id
        });
      }
      if (property.isMany) {
        var collection = element.get(property.name), idx = collection.indexOf(r);
        if (idx === -1) {
          idx = collection.length;
        }
        if (!reference) {
          collection.splice(idx, 1);
        } else {
          collection[idx] = reference;
        }
      } else {
        element.set(property.name, reference);
      }
    }
  }
  function handleClose() {
    stack.pop().handleEnd();
  }
  var PREAMBLE_START_PATTERN = /^<\?xml /i;
  var ENCODING_PATTERN = / encoding="([^"]+)"/i;
  var UTF_8_PATTERN = /^utf-8$/i;
  function handleQuestion(question) {
    if (!PREAMBLE_START_PATTERN.test(question)) {
      return;
    }
    var match = ENCODING_PATTERN.exec(question);
    var encoding = match && match[1];
    if (!encoding || UTF_8_PATTERN.test(encoding)) {
      return;
    }
    context.addWarning({
      message: "unsupported document encoding <" + encoding + ">, falling back to UTF-8"
    });
  }
  function handleOpen(node, getContext2) {
    var handler = stack.peek();
    try {
      stack.push(handler.handleNode(node));
    } catch (err) {
      if (handleError(err, getContext2, lax)) {
        stack.push(new NoopHandler());
      }
    }
  }
  function handleCData(text, getContext2) {
    try {
      stack.peek().handleText(text);
    } catch (err) {
      handleWarning(err, getContext2);
    }
  }
  function handleText(text, getContext2) {
    if (!text.trim()) {
      return;
    }
    handleCData(text, getContext2);
  }
  var uriMap = model.getPackages().reduce(function(uriMap2, p) {
    uriMap2[p.uri] = p.prefix;
    return uriMap2;
  }, Object.entries(DEFAULT_NS_MAP).reduce(function(map, [prefix2, url]) {
    map[url] = prefix2;
    return map;
  }, model.config && model.config.nsMap || {}));
  parser.ns(uriMap).on("openTag", function(obj, decodeStr, selfClosing, getContext2) {
    var attrs = obj.attrs || {};
    var decodedAttrs = Object.keys(attrs).reduce(function(d, key) {
      var value = decodeStr(attrs[key]);
      d[key] = value;
      return d;
    }, {});
    var node = {
      name: obj.name,
      originalName: obj.originalName,
      attributes: decodedAttrs,
      ns: obj.ns
    };
    handleOpen(node, getContext2);
  }).on("question", handleQuestion).on("closeTag", handleClose).on("cdata", handleCData).on("text", function(text, decodeEntities2, getContext2) {
    handleText(decodeEntities2(text), getContext2);
  }).on("error", handleError).on("warn", handleWarning);
  return new Promise(function(resolve, reject) {
    var err;
    try {
      parser.parse(xml2);
      resolveReferences();
    } catch (e) {
      err = e;
    }
    var rootElement = rootHandler.element;
    if (!err && !rootElement) {
      err = error2("failed to parse document as <" + rootHandler.type.$descriptor.name + ">");
    }
    var warnings = context.warnings;
    var references = context.references;
    var elementsById = context.elementsById;
    if (err) {
      err.warnings = warnings;
      return reject(err);
    } else {
      return resolve({
        rootElement,
        elementsById,
        references,
        warnings
      });
    }
  });
};
Reader.prototype.handler = function(name2) {
  return new RootElementHandler(this.model, name2);
};
function createStack() {
  var stack = [];
  Object.defineProperty(stack, "peek", {
    value: function() {
      return this[this.length - 1];
    }
  });
  return stack;
}
var XML_PREAMBLE = '<?xml version="1.0" encoding="UTF-8"?>\n';
var ESCAPE_ATTR_CHARS = /<|>|'|"|&|\n\r|\n/g;
var ESCAPE_CHARS = /<|>|&/g;
function Namespaces(parent) {
  this.prefixMap = {};
  this.uriMap = {};
  this.used = {};
  this.wellknown = [];
  this.custom = [];
  this.parent = parent;
  this.defaultPrefixMap = parent && parent.defaultPrefixMap || {};
}
Namespaces.prototype.mapDefaultPrefixes = function(defaultPrefixMap) {
  this.defaultPrefixMap = defaultPrefixMap;
};
Namespaces.prototype.defaultUriByPrefix = function(prefix2) {
  return this.defaultPrefixMap[prefix2];
};
Namespaces.prototype.byUri = function(uri2) {
  return this.uriMap[uri2] || this.parent && this.parent.byUri(uri2);
};
Namespaces.prototype.add = function(ns, isWellknown) {
  this.uriMap[ns.uri] = ns;
  if (isWellknown) {
    this.wellknown.push(ns);
  } else {
    this.custom.push(ns);
  }
  this.mapPrefix(ns.prefix, ns.uri);
};
Namespaces.prototype.uriByPrefix = function(prefix2) {
  return this.prefixMap[prefix2 || "xmlns"] || this.parent && this.parent.uriByPrefix(prefix2);
};
Namespaces.prototype.mapPrefix = function(prefix2, uri2) {
  this.prefixMap[prefix2 || "xmlns"] = uri2;
};
Namespaces.prototype.getNSKey = function(ns) {
  return ns.prefix !== void 0 ? ns.uri + "|" + ns.prefix : ns.uri;
};
Namespaces.prototype.logUsed = function(ns) {
  var uri2 = ns.uri;
  var nsKey = this.getNSKey(ns);
  this.used[nsKey] = this.byUri(uri2);
  if (this.parent) {
    this.parent.logUsed(ns);
  }
};
Namespaces.prototype.getUsed = function(ns) {
  var allNs = [].concat(this.wellknown, this.custom);
  return allNs.filter((ns2) => {
    var nsKey = this.getNSKey(ns2);
    return this.used[nsKey];
  });
};
function lower(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}
function nameToAlias(name2, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return lower(name2);
  } else {
    return name2;
  }
}
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}
function nsName(ns) {
  if (isString(ns)) {
    return ns;
  } else {
    return (ns.prefix ? ns.prefix + ":" : "") + ns.localName;
  }
}
function getNsAttrs(namespaces) {
  return namespaces.getUsed().filter(function(ns) {
    return ns.prefix !== "xml";
  }).map(function(ns) {
    var name2 = "xmlns" + (ns.prefix ? ":" + ns.prefix : "");
    return { name: name2, value: ns.uri };
  });
}
function getElementNs(ns, descriptor) {
  if (descriptor.isGeneric) {
    return assign({ localName: descriptor.ns.localName }, ns);
  } else {
    return assign({ localName: nameToAlias(descriptor.ns.localName, descriptor.$pkg) }, ns);
  }
}
function getPropertyNs(ns, descriptor) {
  return assign({ localName: descriptor.ns.localName }, ns);
}
function getSerializableProperties(element) {
  var descriptor = element.$descriptor;
  return filter(descriptor.properties, function(p) {
    var name2 = p.name;
    if (p.isVirtual) {
      return false;
    }
    if (!has(element, name2)) {
      return false;
    }
    var value = element[name2];
    if (value === p.default) {
      return false;
    }
    if (value === null) {
      return false;
    }
    return p.isMany ? value.length : true;
  });
}
var ESCAPE_ATTR_MAP = {
  "\n": "#10",
  "\n\r": "#10",
  '"': "#34",
  "'": "#39",
  "<": "#60",
  ">": "#62",
  "&": "#38"
};
var ESCAPE_MAP = {
  "<": "lt",
  ">": "gt",
  "&": "amp"
};
function escape(str, charPattern, replaceMap) {
  str = isString(str) ? str : "" + str;
  return str.replace(charPattern, function(s) {
    return "&" + replaceMap[s] + ";";
  });
}
function escapeAttr(str) {
  return escape(str, ESCAPE_ATTR_CHARS, ESCAPE_ATTR_MAP);
}
function escapeBody(str) {
  return escape(str, ESCAPE_CHARS, ESCAPE_MAP);
}
function filterAttributes(props) {
  return filter(props, function(p) {
    return p.isAttr;
  });
}
function filterContained(props) {
  return filter(props, function(p) {
    return !p.isAttr;
  });
}
function ReferenceSerializer(tagName) {
  this.tagName = tagName;
}
ReferenceSerializer.prototype.build = function(element) {
  this.element = element;
  return this;
};
ReferenceSerializer.prototype.serializeTo = function(writer) {
  writer.appendIndent().append("<" + this.tagName + ">" + this.element.id + "</" + this.tagName + ">").appendNewLine();
};
function BodySerializer() {
}
BodySerializer.prototype.serializeValue = BodySerializer.prototype.serializeTo = function(writer) {
  writer.append(
    this.escape ? escapeBody(this.value) : this.value
  );
};
BodySerializer.prototype.build = function(prop, value) {
  this.value = value;
  if (prop.type === "String" && value.search(ESCAPE_CHARS) !== -1) {
    this.escape = true;
  }
  return this;
};
function ValueSerializer(tagName) {
  this.tagName = tagName;
}
inherits(ValueSerializer, BodySerializer);
ValueSerializer.prototype.serializeTo = function(writer) {
  writer.appendIndent().append("<" + this.tagName + ">");
  this.serializeValue(writer);
  writer.append("</" + this.tagName + ">").appendNewLine();
};
function ElementSerializer(parent, propertyDescriptor) {
  this.body = [];
  this.attrs = [];
  this.parent = parent;
  this.propertyDescriptor = propertyDescriptor;
}
ElementSerializer.prototype.build = function(element) {
  this.element = element;
  var elementDescriptor = element.$descriptor, propertyDescriptor = this.propertyDescriptor;
  var otherAttrs, properties;
  var isGeneric = elementDescriptor.isGeneric;
  if (isGeneric) {
    otherAttrs = this.parseGenericNsAttributes(element);
  } else {
    otherAttrs = this.parseNsAttributes(element);
  }
  if (propertyDescriptor) {
    this.ns = this.nsPropertyTagName(propertyDescriptor);
  } else {
    this.ns = this.nsTagName(elementDescriptor);
  }
  this.tagName = this.addTagName(this.ns);
  if (isGeneric) {
    this.parseGenericContainments(element);
  } else {
    properties = getSerializableProperties(element);
    this.parseAttributes(filterAttributes(properties));
    this.parseContainments(filterContained(properties));
  }
  this.parseGenericAttributes(element, otherAttrs);
  return this;
};
ElementSerializer.prototype.nsTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getElementNs(effectiveNs, descriptor);
};
ElementSerializer.prototype.nsPropertyTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getPropertyNs(effectiveNs, descriptor);
};
ElementSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.ns.uri;
};
ElementSerializer.prototype.nsAttributeName = function(element) {
  var ns;
  if (isString(element)) {
    ns = parseName(element);
  } else {
    ns = element.ns;
  }
  if (element.inherited) {
    return { localName: ns.localName };
  }
  var effectiveNs = this.logNamespaceUsed(ns);
  this.getNamespaces().logUsed(effectiveNs);
  if (this.isLocalNs(effectiveNs)) {
    return { localName: ns.localName };
  } else {
    return assign({ localName: ns.localName }, effectiveNs);
  }
};
ElementSerializer.prototype.parseGenericNsAttributes = function(element) {
  return Object.entries(element).filter(
    ([key, value]) => !key.startsWith("$") && this.parseNsAttribute(element, key, value)
  ).map(
    ([key, value]) => ({ name: key, value })
  );
};
ElementSerializer.prototype.parseGenericContainments = function(element) {
  var body = element.$body;
  if (body) {
    this.body.push(new BodySerializer().build({ type: "String" }, body));
  }
  var children = element.$children;
  if (children) {
    forEach(children, (child) => {
      this.body.push(new ElementSerializer(this).build(child));
    });
  }
};
ElementSerializer.prototype.parseNsAttribute = function(element, name2, value) {
  var model = element.$model;
  var nameNs = parseName(name2);
  var ns;
  if (nameNs.prefix === "xmlns") {
    ns = { prefix: nameNs.localName, uri: value };
  }
  if (!nameNs.prefix && nameNs.localName === "xmlns") {
    ns = { uri: value };
  }
  if (!ns) {
    return {
      name: name2,
      value
    };
  }
  if (model && model.getPackage(value)) {
    this.logNamespace(ns, true, true);
  } else {
    var actualNs = this.logNamespaceUsed(ns, true);
    this.getNamespaces().logUsed(actualNs);
  }
};
ElementSerializer.prototype.parseNsAttributes = function(element) {
  var self = this;
  var genericAttrs = element.$attrs;
  var attributes = [];
  forEach(genericAttrs, function(value, name2) {
    var nonNsAttr = self.parseNsAttribute(element, name2, value);
    if (nonNsAttr) {
      attributes.push(nonNsAttr);
    }
  });
  return attributes;
};
ElementSerializer.prototype.parseGenericAttributes = function(element, attributes) {
  var self = this;
  forEach(attributes, function(attr) {
    try {
      self.addAttribute(self.nsAttributeName(attr.name), attr.value);
    } catch (e) {
      typeof console !== "undefined" && console.warn(
        `missing namespace information for <${attr.name}=${attr.value}> on`,
        element,
        e
      );
    }
  });
};
ElementSerializer.prototype.parseContainments = function(properties) {
  var self = this, body = this.body, element = this.element;
  forEach(properties, function(p) {
    var value = element.get(p.name), isReference = p.isReference, isMany = p.isMany;
    if (!isMany) {
      value = [value];
    }
    if (p.isBody) {
      body.push(new BodySerializer().build(p, value[0]));
    } else if (isSimple(p.type)) {
      forEach(value, function(v) {
        body.push(new ValueSerializer(self.addTagName(self.nsPropertyTagName(p))).build(p, v));
      });
    } else if (isReference) {
      forEach(value, function(v) {
        body.push(new ReferenceSerializer(self.addTagName(self.nsPropertyTagName(p))).build(v));
      });
    } else {
      var serialization = getSerialization(p);
      forEach(value, function(v) {
        var serializer;
        if (serialization) {
          if (serialization === SERIALIZE_PROPERTY) {
            serializer = new ElementSerializer(self, p);
          } else {
            serializer = new TypeSerializer(self, p, serialization);
          }
        } else {
          serializer = new ElementSerializer(self);
        }
        body.push(serializer.build(v));
      });
    }
  });
};
ElementSerializer.prototype.getNamespaces = function(local) {
  var namespaces = this.namespaces, parent = this.parent, parentNamespaces;
  if (!namespaces) {
    parentNamespaces = parent && parent.getNamespaces();
    if (local || !parentNamespaces) {
      this.namespaces = namespaces = new Namespaces(parentNamespaces);
    } else {
      namespaces = parentNamespaces;
    }
  }
  return namespaces;
};
ElementSerializer.prototype.logNamespace = function(ns, wellknown, local) {
  var namespaces = this.getNamespaces(local);
  var nsUri = ns.uri, nsPrefix = ns.prefix;
  var existing = namespaces.byUri(nsUri);
  if (!existing || local) {
    namespaces.add(ns, wellknown);
  }
  namespaces.mapPrefix(nsPrefix, nsUri);
  return ns;
};
ElementSerializer.prototype.logNamespaceUsed = function(ns, local) {
  var namespaces = this.getNamespaces(local);
  var prefix2 = ns.prefix, uri2 = ns.uri, newPrefix, idx, wellknownUri;
  if (!prefix2 && !uri2) {
    return { localName: ns.localName };
  }
  wellknownUri = namespaces.defaultUriByPrefix(prefix2);
  uri2 = uri2 || wellknownUri || namespaces.uriByPrefix(prefix2);
  if (!uri2) {
    throw new Error("no namespace uri given for prefix <" + prefix2 + ">");
  }
  ns = namespaces.byUri(uri2);
  if (!ns && !prefix2) {
    ns = this.logNamespace({ uri: uri2 }, wellknownUri === uri2, true);
  }
  if (!ns) {
    newPrefix = prefix2;
    idx = 1;
    while (namespaces.uriByPrefix(newPrefix)) {
      newPrefix = prefix2 + "_" + idx++;
    }
    ns = this.logNamespace({ prefix: newPrefix, uri: uri2 }, wellknownUri === uri2);
  }
  if (prefix2) {
    namespaces.mapPrefix(prefix2, uri2);
  }
  return ns;
};
ElementSerializer.prototype.parseAttributes = function(properties) {
  var self = this, element = this.element;
  forEach(properties, function(p) {
    var value = element.get(p.name);
    if (p.isReference) {
      if (!p.isMany) {
        value = value.id;
      } else {
        var values = [];
        forEach(value, function(v) {
          values.push(v.id);
        });
        value = values.join(" ");
      }
    }
    self.addAttribute(self.nsAttributeName(p), value);
  });
};
ElementSerializer.prototype.addTagName = function(nsTagName) {
  var actualNs = this.logNamespaceUsed(nsTagName);
  this.getNamespaces().logUsed(actualNs);
  return nsName(nsTagName);
};
ElementSerializer.prototype.addAttribute = function(name2, value) {
  var attrs = this.attrs;
  if (isString(value)) {
    value = escapeAttr(value);
  }
  var idx = findIndex(attrs, function(element) {
    return element.name.localName === name2.localName && element.name.uri === name2.uri && element.name.prefix === name2.prefix;
  });
  var attr = { name: name2, value };
  if (idx !== -1) {
    attrs.splice(idx, 1, attr);
  } else {
    attrs.push(attr);
  }
};
ElementSerializer.prototype.serializeAttributes = function(writer) {
  var attrs = this.attrs, namespaces = this.namespaces;
  if (namespaces) {
    attrs = getNsAttrs(namespaces).concat(attrs);
  }
  forEach(attrs, function(a) {
    writer.append(" ").append(nsName(a.name)).append('="').append(a.value).append('"');
  });
};
ElementSerializer.prototype.serializeTo = function(writer) {
  var firstBody = this.body[0], indent = firstBody && firstBody.constructor !== BodySerializer;
  writer.appendIndent().append("<" + this.tagName);
  this.serializeAttributes(writer);
  writer.append(firstBody ? ">" : " />");
  if (firstBody) {
    if (indent) {
      writer.appendNewLine().indent();
    }
    forEach(this.body, function(b) {
      b.serializeTo(writer);
    });
    if (indent) {
      writer.unindent().appendIndent();
    }
    writer.append("</" + this.tagName + ">");
  }
  writer.appendNewLine();
};
function TypeSerializer(parent, propertyDescriptor, serialization) {
  ElementSerializer.call(this, parent, propertyDescriptor);
  this.serialization = serialization;
}
inherits(TypeSerializer, ElementSerializer);
TypeSerializer.prototype.parseNsAttributes = function(element) {
  var attributes = ElementSerializer.prototype.parseNsAttributes.call(this, element).filter(
    (attr) => attr.name !== this.serialization
  );
  var descriptor = element.$descriptor;
  if (descriptor.name === this.propertyDescriptor.type) {
    return attributes;
  }
  var typeNs = this.typeNs = this.nsTagName(descriptor);
  this.getNamespaces().logUsed(this.typeNs);
  var pkg = element.$model.getPackage(typeNs.uri), typePrefix = pkg.xml && pkg.xml.typePrefix || "";
  this.addAttribute(
    this.nsAttributeName(this.serialization),
    (typeNs.prefix ? typeNs.prefix + ":" : "") + typePrefix + descriptor.ns.localName
  );
  return attributes;
};
TypeSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === (this.typeNs || this.ns).uri;
};
function SavingWriter() {
  this.value = "";
  this.write = function(str) {
    this.value += str;
  };
}
function FormatingWriter(out, format) {
  var indent = [""];
  this.append = function(str) {
    out.write(str);
    return this;
  };
  this.appendNewLine = function() {
    if (format) {
      out.write("\n");
    }
    return this;
  };
  this.appendIndent = function() {
    if (format) {
      out.write(indent.join("  "));
    }
    return this;
  };
  this.indent = function() {
    indent.push("");
    return this;
  };
  this.unindent = function() {
    indent.pop();
    return this;
  };
}
function Writer(options) {
  options = assign({ format: false, preamble: true }, options || {});
  function toXML(tree, writer) {
    var internalWriter = writer || new SavingWriter();
    var formatingWriter = new FormatingWriter(internalWriter, options.format);
    if (options.preamble) {
      formatingWriter.append(XML_PREAMBLE);
    }
    var serializer = new ElementSerializer();
    var model = tree.$model;
    serializer.getNamespaces().mapDefaultPrefixes(getDefaultPrefixMappings(model));
    serializer.build(tree).serializeTo(formatingWriter);
    if (!writer) {
      return internalWriter.value;
    }
  }
  return {
    toXML
  };
}
function getDefaultPrefixMappings(model) {
  const nsMap = model.config && model.config.nsMap || {};
  const prefixMap = {};
  for (const prefix2 in DEFAULT_NS_MAP) {
    prefixMap[prefix2] = DEFAULT_NS_MAP[prefix2];
  }
  for (const uri2 in nsMap) {
    const prefix2 = nsMap[uri2];
    prefixMap[prefix2] = uri2;
  }
  for (const pkg of model.getPackages()) {
    prefixMap[pkg.prefix] = pkg.uri;
  }
  return prefixMap;
}

// node_modules/bpmn-moddle/dist/index.js
function BpmnModdle(packages2, options) {
  Moddle.call(this, packages2, options);
}
BpmnModdle.prototype = Object.create(Moddle.prototype);
BpmnModdle.prototype.fromXML = function(xmlStr, typeName, options) {
  if (!isString(typeName)) {
    options = typeName;
    typeName = "bpmn:Definitions";
  }
  var reader = new Reader(assign({ model: this, lax: true }, options));
  var rootHandler = reader.handler(typeName);
  return reader.fromXML(xmlStr, rootHandler);
};
BpmnModdle.prototype.toXML = function(element, options) {
  var writer = new Writer(options);
  return new Promise(function(resolve, reject) {
    try {
      var result = writer.toXML(element);
      return resolve({
        xml: result
      });
    } catch (err) {
      return reject(err);
    }
  });
};
var name$5 = "BPMN20";
var uri$5 = "http://www.omg.org/spec/BPMN/20100524/MODEL";
var prefix$5 = "bpmn";
var associations$5 = [];
var types$5 = [
  {
    name: "Interface",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "operations",
        type: "Operation",
        isMany: true
      },
      {
        name: "implementationRef",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Operation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "inMessageRef",
        type: "Message",
        isReference: true
      },
      {
        name: "outMessageRef",
        type: "Message",
        isReference: true
      },
      {
        name: "errorRef",
        type: "Error",
        isMany: true,
        isReference: true
      },
      {
        name: "implementationRef",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "EndPoint",
    superClass: [
      "RootElement"
    ]
  },
  {
    name: "Auditing",
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "GlobalTask",
    superClass: [
      "CallableElement"
    ],
    properties: [
      {
        name: "resources",
        type: "ResourceRole",
        isMany: true
      }
    ]
  },
  {
    name: "Monitoring",
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "Performer",
    superClass: [
      "ResourceRole"
    ]
  },
  {
    name: "Process",
    superClass: [
      "FlowElementsContainer",
      "CallableElement"
    ],
    properties: [
      {
        name: "processType",
        type: "ProcessType",
        isAttr: true
      },
      {
        name: "isClosed",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "auditing",
        type: "Auditing"
      },
      {
        name: "monitoring",
        type: "Monitoring"
      },
      {
        name: "properties",
        type: "Property",
        isMany: true
      },
      {
        name: "laneSets",
        isMany: true,
        replaces: "FlowElementsContainer#laneSets",
        type: "LaneSet"
      },
      {
        name: "flowElements",
        isMany: true,
        replaces: "FlowElementsContainer#flowElements",
        type: "FlowElement"
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true
      },
      {
        name: "resources",
        type: "ResourceRole",
        isMany: true
      },
      {
        name: "correlationSubscriptions",
        type: "CorrelationSubscription",
        isMany: true
      },
      {
        name: "supports",
        type: "Process",
        isMany: true,
        isReference: true
      },
      {
        name: "definitionalCollaborationRef",
        type: "Collaboration",
        isAttr: true,
        isReference: true
      },
      {
        name: "isExecutable",
        isAttr: true,
        type: "Boolean"
      }
    ]
  },
  {
    name: "LaneSet",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "lanes",
        type: "Lane",
        isMany: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Lane",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "partitionElementRef",
        type: "BaseElement",
        isAttr: true,
        isReference: true
      },
      {
        name: "partitionElement",
        type: "BaseElement"
      },
      {
        name: "flowNodeRef",
        type: "FlowNode",
        isMany: true,
        isReference: true
      },
      {
        name: "childLaneSet",
        type: "LaneSet",
        xml: {
          serialize: "xsi:type"
        }
      }
    ]
  },
  {
    name: "GlobalManualTask",
    superClass: [
      "GlobalTask"
    ]
  },
  {
    name: "ManualTask",
    superClass: [
      "Task"
    ]
  },
  {
    name: "UserTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "renderings",
        type: "Rendering",
        isMany: true
      },
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Rendering",
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "HumanPerformer",
    superClass: [
      "Performer"
    ]
  },
  {
    name: "PotentialOwner",
    superClass: [
      "HumanPerformer"
    ]
  },
  {
    name: "GlobalUserTask",
    superClass: [
      "GlobalTask"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      },
      {
        name: "renderings",
        type: "Rendering",
        isMany: true
      }
    ]
  },
  {
    name: "Gateway",
    isAbstract: true,
    superClass: [
      "FlowNode"
    ],
    properties: [
      {
        name: "gatewayDirection",
        type: "GatewayDirection",
        "default": "Unspecified",
        isAttr: true
      }
    ]
  },
  {
    name: "EventBasedGateway",
    superClass: [
      "Gateway"
    ],
    properties: [
      {
        name: "instantiate",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "eventGatewayType",
        type: "EventBasedGatewayType",
        isAttr: true,
        "default": "Exclusive"
      }
    ]
  },
  {
    name: "ComplexGateway",
    superClass: [
      "Gateway"
    ],
    properties: [
      {
        name: "activationCondition",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "default",
        type: "SequenceFlow",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ExclusiveGateway",
    superClass: [
      "Gateway"
    ],
    properties: [
      {
        name: "default",
        type: "SequenceFlow",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "InclusiveGateway",
    superClass: [
      "Gateway"
    ],
    properties: [
      {
        name: "default",
        type: "SequenceFlow",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ParallelGateway",
    superClass: [
      "Gateway"
    ]
  },
  {
    name: "RootElement",
    isAbstract: true,
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "Relationship",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "type",
        isAttr: true,
        type: "String"
      },
      {
        name: "direction",
        type: "RelationshipDirection",
        isAttr: true
      },
      {
        name: "source",
        isMany: true,
        isReference: true,
        type: "Element"
      },
      {
        name: "target",
        isMany: true,
        isReference: true,
        type: "Element"
      }
    ]
  },
  {
    name: "BaseElement",
    isAbstract: true,
    properties: [
      {
        name: "id",
        isAttr: true,
        type: "String",
        isId: true
      },
      {
        name: "documentation",
        type: "Documentation",
        isMany: true
      },
      {
        name: "extensionDefinitions",
        type: "ExtensionDefinition",
        isMany: true,
        isReference: true
      },
      {
        name: "extensionElements",
        type: "ExtensionElements"
      }
    ]
  },
  {
    name: "Extension",
    properties: [
      {
        name: "mustUnderstand",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "definition",
        type: "ExtensionDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ExtensionDefinition",
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "extensionAttributeDefinitions",
        type: "ExtensionAttributeDefinition",
        isMany: true
      }
    ]
  },
  {
    name: "ExtensionAttributeDefinition",
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "type",
        isAttr: true,
        type: "String"
      },
      {
        name: "isReference",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "extensionDefinition",
        type: "ExtensionDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ExtensionElements",
    properties: [
      {
        name: "valueRef",
        isAttr: true,
        isReference: true,
        type: "Element"
      },
      {
        name: "values",
        type: "Element",
        isMany: true
      },
      {
        name: "extensionAttributeDefinition",
        type: "ExtensionAttributeDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Documentation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "text",
        type: "String",
        isBody: true
      },
      {
        name: "textFormat",
        "default": "text/plain",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Event",
    isAbstract: true,
    superClass: [
      "FlowNode",
      "InteractionNode"
    ],
    properties: [
      {
        name: "properties",
        type: "Property",
        isMany: true
      }
    ]
  },
  {
    name: "IntermediateCatchEvent",
    superClass: [
      "CatchEvent"
    ]
  },
  {
    name: "IntermediateThrowEvent",
    superClass: [
      "ThrowEvent"
    ]
  },
  {
    name: "EndEvent",
    superClass: [
      "ThrowEvent"
    ]
  },
  {
    name: "StartEvent",
    superClass: [
      "CatchEvent"
    ],
    properties: [
      {
        name: "isInterrupting",
        "default": true,
        isAttr: true,
        type: "Boolean"
      }
    ]
  },
  {
    name: "ThrowEvent",
    isAbstract: true,
    superClass: [
      "Event"
    ],
    properties: [
      {
        name: "dataInputs",
        type: "DataInput",
        isMany: true
      },
      {
        name: "dataInputAssociations",
        type: "DataInputAssociation",
        isMany: true
      },
      {
        name: "inputSet",
        type: "InputSet"
      },
      {
        name: "eventDefinitions",
        type: "EventDefinition",
        isMany: true
      },
      {
        name: "eventDefinitionRef",
        type: "EventDefinition",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "CatchEvent",
    isAbstract: true,
    superClass: [
      "Event"
    ],
    properties: [
      {
        name: "parallelMultiple",
        isAttr: true,
        type: "Boolean",
        "default": false
      },
      {
        name: "dataOutputs",
        type: "DataOutput",
        isMany: true
      },
      {
        name: "dataOutputAssociations",
        type: "DataOutputAssociation",
        isMany: true
      },
      {
        name: "outputSet",
        type: "OutputSet"
      },
      {
        name: "eventDefinitions",
        type: "EventDefinition",
        isMany: true
      },
      {
        name: "eventDefinitionRef",
        type: "EventDefinition",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "BoundaryEvent",
    superClass: [
      "CatchEvent"
    ],
    properties: [
      {
        name: "cancelActivity",
        "default": true,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "attachedToRef",
        type: "Activity",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "EventDefinition",
    isAbstract: true,
    superClass: [
      "RootElement"
    ]
  },
  {
    name: "CancelEventDefinition",
    superClass: [
      "EventDefinition"
    ]
  },
  {
    name: "ErrorEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "errorRef",
        type: "Error",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "TerminateEventDefinition",
    superClass: [
      "EventDefinition"
    ]
  },
  {
    name: "EscalationEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "escalationRef",
        type: "Escalation",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Escalation",
    properties: [
      {
        name: "structureRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "escalationCode",
        isAttr: true,
        type: "String"
      }
    ],
    superClass: [
      "RootElement"
    ]
  },
  {
    name: "CompensateEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "waitForCompletion",
        isAttr: true,
        type: "Boolean",
        "default": true
      },
      {
        name: "activityRef",
        type: "Activity",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "TimerEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "timeDate",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "timeCycle",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "timeDuration",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      }
    ]
  },
  {
    name: "LinkEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "target",
        type: "LinkEventDefinition",
        isReference: true
      },
      {
        name: "source",
        type: "LinkEventDefinition",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "MessageEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true
      },
      {
        name: "operationRef",
        type: "Operation",
        isReference: true
      }
    ]
  },
  {
    name: "ConditionalEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "condition",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      }
    ]
  },
  {
    name: "SignalEventDefinition",
    superClass: [
      "EventDefinition"
    ],
    properties: [
      {
        name: "signalRef",
        type: "Signal",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Signal",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "structureRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ImplicitThrowEvent",
    superClass: [
      "ThrowEvent"
    ]
  },
  {
    name: "DataState",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ItemAwareElement",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "itemSubjectRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      },
      {
        name: "dataState",
        type: "DataState"
      }
    ]
  },
  {
    name: "DataAssociation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "sourceRef",
        type: "ItemAwareElement",
        isMany: true,
        isReference: true
      },
      {
        name: "targetRef",
        type: "ItemAwareElement",
        isReference: true
      },
      {
        name: "transformation",
        type: "FormalExpression",
        xml: {
          serialize: "property"
        }
      },
      {
        name: "assignment",
        type: "Assignment",
        isMany: true
      }
    ]
  },
  {
    name: "DataInput",
    superClass: [
      "ItemAwareElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "isCollection",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "inputSetRef",
        type: "InputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "inputSetWithOptional",
        type: "InputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "inputSetWithWhileExecuting",
        type: "InputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      }
    ]
  },
  {
    name: "DataOutput",
    superClass: [
      "ItemAwareElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "isCollection",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "outputSetRef",
        type: "OutputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "outputSetWithOptional",
        type: "OutputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "outputSetWithWhileExecuting",
        type: "OutputSet",
        isMany: true,
        isVirtual: true,
        isReference: true
      }
    ]
  },
  {
    name: "InputSet",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "dataInputRefs",
        type: "DataInput",
        isMany: true,
        isReference: true
      },
      {
        name: "optionalInputRefs",
        type: "DataInput",
        isMany: true,
        isReference: true
      },
      {
        name: "whileExecutingInputRefs",
        type: "DataInput",
        isMany: true,
        isReference: true
      },
      {
        name: "outputSetRefs",
        type: "OutputSet",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "OutputSet",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "dataOutputRefs",
        type: "DataOutput",
        isMany: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "inputSetRefs",
        type: "InputSet",
        isMany: true,
        isReference: true
      },
      {
        name: "optionalOutputRefs",
        type: "DataOutput",
        isMany: true,
        isReference: true
      },
      {
        name: "whileExecutingOutputRefs",
        type: "DataOutput",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "Property",
    superClass: [
      "ItemAwareElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "DataInputAssociation",
    superClass: [
      "DataAssociation"
    ]
  },
  {
    name: "DataOutputAssociation",
    superClass: [
      "DataAssociation"
    ]
  },
  {
    name: "InputOutputSpecification",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "dataInputs",
        type: "DataInput",
        isMany: true
      },
      {
        name: "dataOutputs",
        type: "DataOutput",
        isMany: true
      },
      {
        name: "inputSets",
        type: "InputSet",
        isMany: true
      },
      {
        name: "outputSets",
        type: "OutputSet",
        isMany: true
      }
    ]
  },
  {
    name: "DataObject",
    superClass: [
      "FlowElement",
      "ItemAwareElement"
    ],
    properties: [
      {
        name: "isCollection",
        "default": false,
        isAttr: true,
        type: "Boolean"
      }
    ]
  },
  {
    name: "InputOutputBinding",
    properties: [
      {
        name: "inputDataRef",
        type: "InputSet",
        isAttr: true,
        isReference: true
      },
      {
        name: "outputDataRef",
        type: "OutputSet",
        isAttr: true,
        isReference: true
      },
      {
        name: "operationRef",
        type: "Operation",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Assignment",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "from",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "to",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      }
    ]
  },
  {
    name: "DataStore",
    superClass: [
      "RootElement",
      "ItemAwareElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "capacity",
        isAttr: true,
        type: "Integer"
      },
      {
        name: "isUnlimited",
        "default": true,
        isAttr: true,
        type: "Boolean"
      }
    ]
  },
  {
    name: "DataStoreReference",
    superClass: [
      "ItemAwareElement",
      "FlowElement"
    ],
    properties: [
      {
        name: "dataStoreRef",
        type: "DataStore",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "DataObjectReference",
    superClass: [
      "ItemAwareElement",
      "FlowElement"
    ],
    properties: [
      {
        name: "dataObjectRef",
        type: "DataObject",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ConversationLink",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "sourceRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "targetRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ConversationAssociation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "innerConversationNodeRef",
        type: "ConversationNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "outerConversationNodeRef",
        type: "ConversationNode",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "CallConversation",
    superClass: [
      "ConversationNode"
    ],
    properties: [
      {
        name: "calledCollaborationRef",
        type: "Collaboration",
        isAttr: true,
        isReference: true
      },
      {
        name: "participantAssociations",
        type: "ParticipantAssociation",
        isMany: true
      }
    ]
  },
  {
    name: "Conversation",
    superClass: [
      "ConversationNode"
    ]
  },
  {
    name: "SubConversation",
    superClass: [
      "ConversationNode"
    ],
    properties: [
      {
        name: "conversationNodes",
        type: "ConversationNode",
        isMany: true
      }
    ]
  },
  {
    name: "ConversationNode",
    isAbstract: true,
    superClass: [
      "InteractionNode",
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "participantRef",
        type: "Participant",
        isMany: true,
        isReference: true
      },
      {
        name: "messageFlowRefs",
        type: "MessageFlow",
        isMany: true,
        isReference: true
      },
      {
        name: "correlationKeys",
        type: "CorrelationKey",
        isMany: true
      }
    ]
  },
  {
    name: "GlobalConversation",
    superClass: [
      "Collaboration"
    ]
  },
  {
    name: "PartnerEntity",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "participantRef",
        type: "Participant",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "PartnerRole",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "participantRef",
        type: "Participant",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "CorrelationProperty",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "correlationPropertyRetrievalExpression",
        type: "CorrelationPropertyRetrievalExpression",
        isMany: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "type",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Error",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "structureRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "errorCode",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "CorrelationKey",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "correlationPropertyRef",
        type: "CorrelationProperty",
        isMany: true,
        isReference: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Expression",
    superClass: [
      "BaseElement"
    ],
    isAbstract: false,
    properties: [
      {
        name: "body",
        isBody: true,
        type: "String"
      }
    ]
  },
  {
    name: "FormalExpression",
    superClass: [
      "Expression"
    ],
    properties: [
      {
        name: "language",
        isAttr: true,
        type: "String"
      },
      {
        name: "evaluatesToTypeRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Message",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "itemRef",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ItemDefinition",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "itemKind",
        type: "ItemKind",
        isAttr: true
      },
      {
        name: "structureRef",
        isAttr: true,
        type: "String"
      },
      {
        name: "isCollection",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "import",
        type: "Import",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "FlowElement",
    isAbstract: true,
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "auditing",
        type: "Auditing"
      },
      {
        name: "monitoring",
        type: "Monitoring"
      },
      {
        name: "categoryValueRef",
        type: "CategoryValue",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "SequenceFlow",
    superClass: [
      "FlowElement"
    ],
    properties: [
      {
        name: "isImmediate",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "conditionExpression",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "sourceRef",
        type: "FlowNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "targetRef",
        type: "FlowNode",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "FlowElementsContainer",
    isAbstract: true,
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "laneSets",
        type: "LaneSet",
        isMany: true
      },
      {
        name: "flowElements",
        type: "FlowElement",
        isMany: true
      }
    ]
  },
  {
    name: "CallableElement",
    isAbstract: true,
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "ioSpecification",
        type: "InputOutputSpecification",
        xml: {
          serialize: "property"
        }
      },
      {
        name: "supportedInterfaceRef",
        type: "Interface",
        isMany: true,
        isReference: true
      },
      {
        name: "ioBinding",
        type: "InputOutputBinding",
        isMany: true,
        xml: {
          serialize: "property"
        }
      }
    ]
  },
  {
    name: "FlowNode",
    isAbstract: true,
    superClass: [
      "FlowElement"
    ],
    properties: [
      {
        name: "incoming",
        type: "SequenceFlow",
        isMany: true,
        isReference: true
      },
      {
        name: "outgoing",
        type: "SequenceFlow",
        isMany: true,
        isReference: true
      },
      {
        name: "lanes",
        type: "Lane",
        isMany: true,
        isVirtual: true,
        isReference: true
      }
    ]
  },
  {
    name: "CorrelationPropertyRetrievalExpression",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "messagePath",
        type: "FormalExpression"
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "CorrelationPropertyBinding",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "dataPath",
        type: "FormalExpression"
      },
      {
        name: "correlationPropertyRef",
        type: "CorrelationProperty",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Resource",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "resourceParameters",
        type: "ResourceParameter",
        isMany: true
      }
    ]
  },
  {
    name: "ResourceParameter",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "isRequired",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "type",
        type: "ItemDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "CorrelationSubscription",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "correlationKeyRef",
        type: "CorrelationKey",
        isAttr: true,
        isReference: true
      },
      {
        name: "correlationPropertyBinding",
        type: "CorrelationPropertyBinding",
        isMany: true
      }
    ]
  },
  {
    name: "MessageFlow",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "sourceRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "targetRef",
        type: "InteractionNode",
        isAttr: true,
        isReference: true
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "MessageFlowAssociation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "innerMessageFlowRef",
        type: "MessageFlow",
        isAttr: true,
        isReference: true
      },
      {
        name: "outerMessageFlowRef",
        type: "MessageFlow",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "InteractionNode",
    isAbstract: true,
    properties: [
      {
        name: "incomingConversationLinks",
        type: "ConversationLink",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "outgoingConversationLinks",
        type: "ConversationLink",
        isMany: true,
        isVirtual: true,
        isReference: true
      }
    ]
  },
  {
    name: "Participant",
    superClass: [
      "InteractionNode",
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "interfaceRef",
        type: "Interface",
        isMany: true,
        isReference: true
      },
      {
        name: "participantMultiplicity",
        type: "ParticipantMultiplicity"
      },
      {
        name: "endPointRefs",
        type: "EndPoint",
        isMany: true,
        isReference: true
      },
      {
        name: "processRef",
        type: "Process",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ParticipantAssociation",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "innerParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true
      },
      {
        name: "outerParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ParticipantMultiplicity",
    properties: [
      {
        name: "minimum",
        "default": 0,
        isAttr: true,
        type: "Integer"
      },
      {
        name: "maximum",
        "default": 1,
        isAttr: true,
        type: "Integer"
      }
    ],
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "Collaboration",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "isClosed",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "participants",
        type: "Participant",
        isMany: true
      },
      {
        name: "messageFlows",
        type: "MessageFlow",
        isMany: true
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true
      },
      {
        name: "conversations",
        type: "ConversationNode",
        isMany: true
      },
      {
        name: "conversationAssociations",
        type: "ConversationAssociation"
      },
      {
        name: "participantAssociations",
        type: "ParticipantAssociation",
        isMany: true
      },
      {
        name: "messageFlowAssociations",
        type: "MessageFlowAssociation",
        isMany: true
      },
      {
        name: "correlationKeys",
        type: "CorrelationKey",
        isMany: true
      },
      {
        name: "choreographyRef",
        type: "Choreography",
        isMany: true,
        isReference: true
      },
      {
        name: "conversationLinks",
        type: "ConversationLink",
        isMany: true
      }
    ]
  },
  {
    name: "ChoreographyActivity",
    isAbstract: true,
    superClass: [
      "FlowNode"
    ],
    properties: [
      {
        name: "participantRef",
        type: "Participant",
        isMany: true,
        isReference: true
      },
      {
        name: "initiatingParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true
      },
      {
        name: "correlationKeys",
        type: "CorrelationKey",
        isMany: true
      },
      {
        name: "loopType",
        type: "ChoreographyLoopType",
        "default": "None",
        isAttr: true
      }
    ]
  },
  {
    name: "CallChoreography",
    superClass: [
      "ChoreographyActivity"
    ],
    properties: [
      {
        name: "calledChoreographyRef",
        type: "Choreography",
        isAttr: true,
        isReference: true
      },
      {
        name: "participantAssociations",
        type: "ParticipantAssociation",
        isMany: true
      }
    ]
  },
  {
    name: "SubChoreography",
    superClass: [
      "ChoreographyActivity",
      "FlowElementsContainer"
    ],
    properties: [
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true
      }
    ]
  },
  {
    name: "ChoreographyTask",
    superClass: [
      "ChoreographyActivity"
    ],
    properties: [
      {
        name: "messageFlowRef",
        type: "MessageFlow",
        isMany: true,
        isReference: true
      }
    ]
  },
  {
    name: "Choreography",
    superClass: [
      "Collaboration",
      "FlowElementsContainer"
    ]
  },
  {
    name: "GlobalChoreographyTask",
    superClass: [
      "Choreography"
    ],
    properties: [
      {
        name: "initiatingParticipantRef",
        type: "Participant",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "TextAnnotation",
    superClass: [
      "Artifact"
    ],
    properties: [
      {
        name: "text",
        type: "String"
      },
      {
        name: "textFormat",
        "default": "text/plain",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Group",
    superClass: [
      "Artifact"
    ],
    properties: [
      {
        name: "categoryValueRef",
        type: "CategoryValue",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Association",
    superClass: [
      "Artifact"
    ],
    properties: [
      {
        name: "associationDirection",
        type: "AssociationDirection",
        isAttr: true
      },
      {
        name: "sourceRef",
        type: "BaseElement",
        isAttr: true,
        isReference: true
      },
      {
        name: "targetRef",
        type: "BaseElement",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "Category",
    superClass: [
      "RootElement"
    ],
    properties: [
      {
        name: "categoryValue",
        type: "CategoryValue",
        isMany: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Artifact",
    isAbstract: true,
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "CategoryValue",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "categorizedFlowElements",
        type: "FlowElement",
        isMany: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "value",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Activity",
    isAbstract: true,
    superClass: [
      "FlowNode"
    ],
    properties: [
      {
        name: "isForCompensation",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "default",
        type: "SequenceFlow",
        isAttr: true,
        isReference: true
      },
      {
        name: "ioSpecification",
        type: "InputOutputSpecification",
        xml: {
          serialize: "property"
        }
      },
      {
        name: "boundaryEventRefs",
        type: "BoundaryEvent",
        isMany: true,
        isReference: true
      },
      {
        name: "properties",
        type: "Property",
        isMany: true
      },
      {
        name: "dataInputAssociations",
        type: "DataInputAssociation",
        isMany: true
      },
      {
        name: "dataOutputAssociations",
        type: "DataOutputAssociation",
        isMany: true
      },
      {
        name: "startQuantity",
        "default": 1,
        isAttr: true,
        type: "Integer"
      },
      {
        name: "resources",
        type: "ResourceRole",
        isMany: true
      },
      {
        name: "completionQuantity",
        "default": 1,
        isAttr: true,
        type: "Integer"
      },
      {
        name: "loopCharacteristics",
        type: "LoopCharacteristics"
      }
    ]
  },
  {
    name: "ServiceTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      },
      {
        name: "operationRef",
        type: "Operation",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "SubProcess",
    superClass: [
      "Activity",
      "FlowElementsContainer",
      "InteractionNode"
    ],
    properties: [
      {
        name: "triggeredByEvent",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "artifacts",
        type: "Artifact",
        isMany: true
      }
    ]
  },
  {
    name: "LoopCharacteristics",
    isAbstract: true,
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "MultiInstanceLoopCharacteristics",
    superClass: [
      "LoopCharacteristics"
    ],
    properties: [
      {
        name: "isSequential",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "behavior",
        type: "MultiInstanceBehavior",
        "default": "All",
        isAttr: true
      },
      {
        name: "loopCardinality",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "loopDataInputRef",
        type: "ItemAwareElement",
        isReference: true
      },
      {
        name: "loopDataOutputRef",
        type: "ItemAwareElement",
        isReference: true
      },
      {
        name: "inputDataItem",
        type: "DataInput",
        xml: {
          serialize: "property"
        }
      },
      {
        name: "outputDataItem",
        type: "DataOutput",
        xml: {
          serialize: "property"
        }
      },
      {
        name: "complexBehaviorDefinition",
        type: "ComplexBehaviorDefinition",
        isMany: true
      },
      {
        name: "completionCondition",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "oneBehaviorEventRef",
        type: "EventDefinition",
        isAttr: true,
        isReference: true
      },
      {
        name: "noneBehaviorEventRef",
        type: "EventDefinition",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "StandardLoopCharacteristics",
    superClass: [
      "LoopCharacteristics"
    ],
    properties: [
      {
        name: "testBefore",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "loopCondition",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "loopMaximum",
        type: "Integer",
        isAttr: true
      }
    ]
  },
  {
    name: "CallActivity",
    superClass: [
      "Activity",
      "InteractionNode"
    ],
    properties: [
      {
        name: "calledElement",
        type: "String",
        isAttr: true
      }
    ]
  },
  {
    name: "Task",
    superClass: [
      "Activity",
      "InteractionNode"
    ]
  },
  {
    name: "SendTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      },
      {
        name: "operationRef",
        type: "Operation",
        isAttr: true,
        isReference: true
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ReceiveTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      },
      {
        name: "instantiate",
        "default": false,
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "operationRef",
        type: "Operation",
        isAttr: true,
        isReference: true
      },
      {
        name: "messageRef",
        type: "Message",
        isAttr: true,
        isReference: true
      }
    ]
  },
  {
    name: "ScriptTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "scriptFormat",
        isAttr: true,
        type: "String"
      },
      {
        name: "script",
        type: "String"
      }
    ]
  },
  {
    name: "BusinessRuleTask",
    superClass: [
      "Task"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "AdHocSubProcess",
    superClass: [
      "SubProcess"
    ],
    properties: [
      {
        name: "completionCondition",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "ordering",
        type: "AdHocOrdering",
        isAttr: true
      },
      {
        name: "cancelRemainingInstances",
        "default": true,
        isAttr: true,
        type: "Boolean"
      }
    ]
  },
  {
    name: "Transaction",
    superClass: [
      "SubProcess"
    ],
    properties: [
      {
        name: "protocol",
        isAttr: true,
        type: "String"
      },
      {
        name: "method",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "GlobalScriptTask",
    superClass: [
      "GlobalTask"
    ],
    properties: [
      {
        name: "scriptLanguage",
        isAttr: true,
        type: "String"
      },
      {
        name: "script",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "GlobalBusinessRuleTask",
    superClass: [
      "GlobalTask"
    ],
    properties: [
      {
        name: "implementation",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ComplexBehaviorDefinition",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "condition",
        type: "FormalExpression"
      },
      {
        name: "event",
        type: "ImplicitThrowEvent"
      }
    ]
  },
  {
    name: "ResourceRole",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "resourceRef",
        type: "Resource",
        isReference: true
      },
      {
        name: "resourceParameterBindings",
        type: "ResourceParameterBinding",
        isMany: true
      },
      {
        name: "resourceAssignmentExpression",
        type: "ResourceAssignmentExpression"
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ResourceParameterBinding",
    properties: [
      {
        name: "expression",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      },
      {
        name: "parameterRef",
        type: "ResourceParameter",
        isAttr: true,
        isReference: true
      }
    ],
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "ResourceAssignmentExpression",
    properties: [
      {
        name: "expression",
        type: "Expression",
        xml: {
          serialize: "xsi:type"
        }
      }
    ],
    superClass: [
      "BaseElement"
    ]
  },
  {
    name: "Import",
    properties: [
      {
        name: "importType",
        isAttr: true,
        type: "String"
      },
      {
        name: "location",
        isAttr: true,
        type: "String"
      },
      {
        name: "namespace",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "Definitions",
    superClass: [
      "BaseElement"
    ],
    properties: [
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "targetNamespace",
        isAttr: true,
        type: "String"
      },
      {
        name: "expressionLanguage",
        "default": "http://www.w3.org/1999/XPath",
        isAttr: true,
        type: "String"
      },
      {
        name: "typeLanguage",
        "default": "http://www.w3.org/2001/XMLSchema",
        isAttr: true,
        type: "String"
      },
      {
        name: "imports",
        type: "Import",
        isMany: true
      },
      {
        name: "extensions",
        type: "Extension",
        isMany: true
      },
      {
        name: "rootElements",
        type: "RootElement",
        isMany: true
      },
      {
        name: "diagrams",
        isMany: true,
        type: "bpmndi:BPMNDiagram"
      },
      {
        name: "exporter",
        isAttr: true,
        type: "String"
      },
      {
        name: "relationships",
        type: "Relationship",
        isMany: true
      },
      {
        name: "exporterVersion",
        isAttr: true,
        type: "String"
      }
    ]
  }
];
var enumerations$3 = [
  {
    name: "ProcessType",
    literalValues: [
      {
        name: "None"
      },
      {
        name: "Public"
      },
      {
        name: "Private"
      }
    ]
  },
  {
    name: "GatewayDirection",
    literalValues: [
      {
        name: "Unspecified"
      },
      {
        name: "Converging"
      },
      {
        name: "Diverging"
      },
      {
        name: "Mixed"
      }
    ]
  },
  {
    name: "EventBasedGatewayType",
    literalValues: [
      {
        name: "Parallel"
      },
      {
        name: "Exclusive"
      }
    ]
  },
  {
    name: "RelationshipDirection",
    literalValues: [
      {
        name: "None"
      },
      {
        name: "Forward"
      },
      {
        name: "Backward"
      },
      {
        name: "Both"
      }
    ]
  },
  {
    name: "ItemKind",
    literalValues: [
      {
        name: "Physical"
      },
      {
        name: "Information"
      }
    ]
  },
  {
    name: "ChoreographyLoopType",
    literalValues: [
      {
        name: "None"
      },
      {
        name: "Standard"
      },
      {
        name: "MultiInstanceSequential"
      },
      {
        name: "MultiInstanceParallel"
      }
    ]
  },
  {
    name: "AssociationDirection",
    literalValues: [
      {
        name: "None"
      },
      {
        name: "One"
      },
      {
        name: "Both"
      }
    ]
  },
  {
    name: "MultiInstanceBehavior",
    literalValues: [
      {
        name: "None"
      },
      {
        name: "One"
      },
      {
        name: "All"
      },
      {
        name: "Complex"
      }
    ]
  },
  {
    name: "AdHocOrdering",
    literalValues: [
      {
        name: "Parallel"
      },
      {
        name: "Sequential"
      }
    ]
  }
];
var xml$1 = {
  tagAlias: "lowerCase",
  typePrefix: "t"
};
var BpmnPackage = {
  name: name$5,
  uri: uri$5,
  prefix: prefix$5,
  associations: associations$5,
  types: types$5,
  enumerations: enumerations$3,
  xml: xml$1
};
var name$4 = "BPMNDI";
var uri$4 = "http://www.omg.org/spec/BPMN/20100524/DI";
var prefix$4 = "bpmndi";
var types$4 = [
  {
    name: "BPMNDiagram",
    properties: [
      {
        name: "plane",
        type: "BPMNPlane",
        redefines: "di:Diagram#rootElement"
      },
      {
        name: "labelStyle",
        type: "BPMNLabelStyle",
        isMany: true
      }
    ],
    superClass: [
      "di:Diagram"
    ]
  },
  {
    name: "BPMNPlane",
    properties: [
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement"
      }
    ],
    superClass: [
      "di:Plane"
    ]
  },
  {
    name: "BPMNShape",
    properties: [
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement"
      },
      {
        name: "isHorizontal",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "isExpanded",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "isMarkerVisible",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "label",
        type: "BPMNLabel"
      },
      {
        name: "isMessageVisible",
        isAttr: true,
        type: "Boolean"
      },
      {
        name: "participantBandKind",
        type: "ParticipantBandKind",
        isAttr: true
      },
      {
        name: "choreographyActivityShape",
        type: "BPMNShape",
        isAttr: true,
        isReference: true
      }
    ],
    superClass: [
      "di:LabeledShape"
    ]
  },
  {
    name: "BPMNEdge",
    properties: [
      {
        name: "label",
        type: "BPMNLabel"
      },
      {
        name: "bpmnElement",
        isAttr: true,
        isReference: true,
        type: "bpmn:BaseElement",
        redefines: "di:DiagramElement#modelElement"
      },
      {
        name: "sourceElement",
        isAttr: true,
        isReference: true,
        type: "di:DiagramElement",
        redefines: "di:Edge#source"
      },
      {
        name: "targetElement",
        isAttr: true,
        isReference: true,
        type: "di:DiagramElement",
        redefines: "di:Edge#target"
      },
      {
        name: "messageVisibleKind",
        type: "MessageVisibleKind",
        isAttr: true,
        "default": "initiating"
      }
    ],
    superClass: [
      "di:LabeledEdge"
    ]
  },
  {
    name: "BPMNLabel",
    properties: [
      {
        name: "labelStyle",
        type: "BPMNLabelStyle",
        isAttr: true,
        isReference: true,
        redefines: "di:DiagramElement#style"
      }
    ],
    superClass: [
      "di:Label"
    ]
  },
  {
    name: "BPMNLabelStyle",
    properties: [
      {
        name: "font",
        type: "dc:Font"
      }
    ],
    superClass: [
      "di:Style"
    ]
  }
];
var enumerations$2 = [
  {
    name: "ParticipantBandKind",
    literalValues: [
      {
        name: "top_initiating"
      },
      {
        name: "middle_initiating"
      },
      {
        name: "bottom_initiating"
      },
      {
        name: "top_non_initiating"
      },
      {
        name: "middle_non_initiating"
      },
      {
        name: "bottom_non_initiating"
      }
    ]
  },
  {
    name: "MessageVisibleKind",
    literalValues: [
      {
        name: "initiating"
      },
      {
        name: "non_initiating"
      }
    ]
  }
];
var associations$4 = [];
var BpmnDiPackage = {
  name: name$4,
  uri: uri$4,
  prefix: prefix$4,
  types: types$4,
  enumerations: enumerations$2,
  associations: associations$4
};
var name$3 = "DC";
var uri$3 = "http://www.omg.org/spec/DD/20100524/DC";
var prefix$3 = "dc";
var types$3 = [
  {
    name: "Boolean"
  },
  {
    name: "Integer"
  },
  {
    name: "Real"
  },
  {
    name: "String"
  },
  {
    name: "Font",
    properties: [
      {
        name: "name",
        type: "String",
        isAttr: true
      },
      {
        name: "size",
        type: "Real",
        isAttr: true
      },
      {
        name: "isBold",
        type: "Boolean",
        isAttr: true
      },
      {
        name: "isItalic",
        type: "Boolean",
        isAttr: true
      },
      {
        name: "isUnderline",
        type: "Boolean",
        isAttr: true
      },
      {
        name: "isStrikeThrough",
        type: "Boolean",
        isAttr: true
      }
    ]
  },
  {
    name: "Point",
    properties: [
      {
        name: "x",
        type: "Real",
        "default": "0",
        isAttr: true
      },
      {
        name: "y",
        type: "Real",
        "default": "0",
        isAttr: true
      }
    ]
  },
  {
    name: "Bounds",
    properties: [
      {
        name: "x",
        type: "Real",
        "default": "0",
        isAttr: true
      },
      {
        name: "y",
        type: "Real",
        "default": "0",
        isAttr: true
      },
      {
        name: "width",
        type: "Real",
        isAttr: true
      },
      {
        name: "height",
        type: "Real",
        isAttr: true
      }
    ]
  }
];
var associations$3 = [];
var DcPackage = {
  name: name$3,
  uri: uri$3,
  prefix: prefix$3,
  types: types$3,
  associations: associations$3
};
var name$2 = "DI";
var uri$2 = "http://www.omg.org/spec/DD/20100524/DI";
var prefix$2 = "di";
var types$2 = [
  {
    name: "DiagramElement",
    isAbstract: true,
    properties: [
      {
        name: "id",
        isAttr: true,
        isId: true,
        type: "String"
      },
      {
        name: "extension",
        type: "Extension"
      },
      {
        name: "owningDiagram",
        type: "Diagram",
        isReadOnly: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "owningElement",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "modelElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true,
        type: "Element"
      },
      {
        name: "style",
        type: "Style",
        isReadOnly: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "ownedElement",
        type: "DiagramElement",
        isReadOnly: true,
        isMany: true,
        isVirtual: true
      }
    ]
  },
  {
    name: "Node",
    isAbstract: true,
    superClass: [
      "DiagramElement"
    ]
  },
  {
    name: "Edge",
    isAbstract: true,
    superClass: [
      "DiagramElement"
    ],
    properties: [
      {
        name: "source",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "target",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true,
        isReference: true
      },
      {
        name: "waypoint",
        isUnique: false,
        isMany: true,
        type: "dc:Point",
        xml: {
          serialize: "xsi:type"
        }
      }
    ]
  },
  {
    name: "Diagram",
    isAbstract: true,
    properties: [
      {
        name: "id",
        isAttr: true,
        isId: true,
        type: "String"
      },
      {
        name: "rootElement",
        type: "DiagramElement",
        isReadOnly: true,
        isVirtual: true
      },
      {
        name: "name",
        isAttr: true,
        type: "String"
      },
      {
        name: "documentation",
        isAttr: true,
        type: "String"
      },
      {
        name: "resolution",
        isAttr: true,
        type: "Real"
      },
      {
        name: "ownedStyle",
        type: "Style",
        isReadOnly: true,
        isMany: true,
        isVirtual: true
      }
    ]
  },
  {
    name: "Shape",
    isAbstract: true,
    superClass: [
      "Node"
    ],
    properties: [
      {
        name: "bounds",
        type: "dc:Bounds"
      }
    ]
  },
  {
    name: "Plane",
    isAbstract: true,
    superClass: [
      "Node"
    ],
    properties: [
      {
        name: "planeElement",
        type: "DiagramElement",
        subsettedProperty: "DiagramElement-ownedElement",
        isMany: true
      }
    ]
  },
  {
    name: "LabeledEdge",
    isAbstract: true,
    superClass: [
      "Edge"
    ],
    properties: [
      {
        name: "ownedLabel",
        type: "Label",
        isReadOnly: true,
        subsettedProperty: "DiagramElement-ownedElement",
        isMany: true,
        isVirtual: true
      }
    ]
  },
  {
    name: "LabeledShape",
    isAbstract: true,
    superClass: [
      "Shape"
    ],
    properties: [
      {
        name: "ownedLabel",
        type: "Label",
        isReadOnly: true,
        subsettedProperty: "DiagramElement-ownedElement",
        isMany: true,
        isVirtual: true
      }
    ]
  },
  {
    name: "Label",
    isAbstract: true,
    superClass: [
      "Node"
    ],
    properties: [
      {
        name: "bounds",
        type: "dc:Bounds"
      }
    ]
  },
  {
    name: "Style",
    isAbstract: true,
    properties: [
      {
        name: "id",
        isAttr: true,
        isId: true,
        type: "String"
      }
    ]
  },
  {
    name: "Extension",
    properties: [
      {
        name: "values",
        isMany: true,
        type: "Element"
      }
    ]
  }
];
var associations$2 = [];
var xml = {
  tagAlias: "lowerCase"
};
var DiPackage = {
  name: name$2,
  uri: uri$2,
  prefix: prefix$2,
  types: types$2,
  associations: associations$2,
  xml
};
var name$1 = "bpmn.io colors for BPMN";
var uri$1 = "http://bpmn.io/schema/bpmn/biocolor/1.0";
var prefix$1 = "bioc";
var types$1 = [
  {
    name: "ColoredShape",
    "extends": [
      "bpmndi:BPMNShape"
    ],
    properties: [
      {
        name: "stroke",
        isAttr: true,
        type: "String"
      },
      {
        name: "fill",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ColoredEdge",
    "extends": [
      "bpmndi:BPMNEdge"
    ],
    properties: [
      {
        name: "stroke",
        isAttr: true,
        type: "String"
      },
      {
        name: "fill",
        isAttr: true,
        type: "String"
      }
    ]
  }
];
var enumerations$1 = [];
var associations$1 = [];
var BiocPackage = {
  name: name$1,
  uri: uri$1,
  prefix: prefix$1,
  types: types$1,
  enumerations: enumerations$1,
  associations: associations$1
};
var name = "BPMN in Color";
var uri = "http://www.omg.org/spec/BPMN/non-normative/color/1.0";
var prefix = "color";
var types = [
  {
    name: "ColoredLabel",
    "extends": [
      "bpmndi:BPMNLabel"
    ],
    properties: [
      {
        name: "color",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ColoredShape",
    "extends": [
      "bpmndi:BPMNShape"
    ],
    properties: [
      {
        name: "background-color",
        isAttr: true,
        type: "String"
      },
      {
        name: "border-color",
        isAttr: true,
        type: "String"
      }
    ]
  },
  {
    name: "ColoredEdge",
    "extends": [
      "bpmndi:BPMNEdge"
    ],
    properties: [
      {
        name: "border-color",
        isAttr: true,
        type: "String"
      }
    ]
  }
];
var enumerations = [];
var associations = [];
var BpmnInColorPackage = {
  name,
  uri,
  prefix,
  types,
  enumerations,
  associations
};
var packages = {
  bpmn: BpmnPackage,
  bpmndi: BpmnDiPackage,
  dc: DcPackage,
  di: DiPackage,
  bioc: BiocPackage,
  color: BpmnInColorPackage
};
function SimpleBpmnModdle(additionalPackages, options) {
  const pks = assign({}, packages, additionalPackages);
  return new BpmnModdle(pks, options);
}

// node_modules/camunda-bpmn-moddle/resources/camunda.json
var camunda_default = {
  name: "Camunda",
  uri: "http://camunda.org/schema/1.0/bpmn",
  prefix: "camunda",
  xml: {
    tagAlias: "lowerCase"
  },
  associations: [],
  types: [
    {
      name: "Definitions",
      isAbstract: true,
      extends: [
        "bpmn:Definitions"
      ],
      properties: [
        {
          name: "diagramRelationId",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "InOutBinding",
      superClass: [
        "Element"
      ],
      isAbstract: true,
      properties: [
        {
          name: "source",
          isAttr: true,
          type: "String"
        },
        {
          name: "sourceExpression",
          isAttr: true,
          type: "String"
        },
        {
          name: "target",
          isAttr: true,
          type: "String"
        },
        {
          name: "businessKey",
          isAttr: true,
          type: "String"
        },
        {
          name: "local",
          isAttr: true,
          type: "Boolean",
          default: false
        },
        {
          name: "variables",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "In",
      superClass: [
        "InOutBinding"
      ],
      meta: {
        allowedIn: [
          "bpmn:CallActivity",
          "bpmn:SignalEventDefinition"
        ]
      }
    },
    {
      name: "Out",
      superClass: [
        "InOutBinding"
      ],
      meta: {
        allowedIn: [
          "bpmn:CallActivity"
        ]
      }
    },
    {
      name: "AsyncCapable",
      isAbstract: true,
      extends: [
        "bpmn:Activity",
        "bpmn:Gateway",
        "bpmn:Event"
      ],
      properties: [
        {
          name: "async",
          isAttr: true,
          type: "Boolean",
          default: false
        },
        {
          name: "asyncBefore",
          isAttr: true,
          type: "Boolean",
          default: false
        },
        {
          name: "asyncAfter",
          isAttr: true,
          type: "Boolean",
          default: false
        },
        {
          name: "exclusive",
          isAttr: true,
          type: "Boolean",
          default: true
        }
      ]
    },
    {
      name: "JobPriorized",
      isAbstract: true,
      extends: [
        "bpmn:Process",
        "camunda:AsyncCapable"
      ],
      properties: [
        {
          name: "jobPriority",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "SignalEventDefinitionExtension",
      isAbstract: true,
      extends: [
        "bpmn:SignalEventDefinition"
      ],
      properties: [
        {
          name: "async",
          isAttr: true,
          type: "Boolean",
          default: false
        }
      ]
    },
    {
      name: "ErrorEventDefinitionExtension",
      isAbstract: true,
      extends: [
        "bpmn:ErrorEventDefinition"
      ],
      properties: [
        {
          name: "errorCodeVariable",
          isAttr: true,
          type: "String"
        },
        {
          name: "errorMessageVariable",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "ErrorEventDefinition",
      superClass: [
        "bpmn:ErrorEventDefinition",
        "Element"
      ],
      properties: [
        {
          name: "expression",
          isAttr: true,
          type: "String"
        }
      ],
      meta: {
        allowedIn: ["bpmn:ServiceTask"]
      }
    },
    {
      name: "Error",
      isAbstract: true,
      extends: [
        "bpmn:Error"
      ],
      properties: [
        {
          name: "camunda:errorMessage",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "PotentialStarter",
      superClass: [
        "Element"
      ],
      properties: [
        {
          name: "resourceAssignmentExpression",
          type: "bpmn:ResourceAssignmentExpression"
        }
      ]
    },
    {
      name: "FormSupported",
      isAbstract: true,
      extends: [
        "bpmn:StartEvent",
        "bpmn:UserTask"
      ],
      properties: [
        {
          name: "formHandlerClass",
          isAttr: true,
          type: "String"
        },
        {
          name: "formKey",
          isAttr: true,
          type: "String"
        },
        {
          name: "formRef",
          isAttr: true,
          type: "String"
        },
        {
          name: "formRefBinding",
          isAttr: true,
          type: "String"
        },
        {
          name: "formRefVersion",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "TemplateSupported",
      isAbstract: true,
      extends: [
        "bpmn:Collaboration",
        "bpmn:Process",
        "bpmn:FlowElement"
      ],
      properties: [
        {
          name: "modelerTemplate",
          isAttr: true,
          type: "String"
        },
        {
          name: "modelerTemplateVersion",
          isAttr: true,
          type: "Integer"
        }
      ]
    },
    {
      name: "Initiator",
      isAbstract: true,
      extends: ["bpmn:StartEvent"],
      properties: [
        {
          name: "initiator",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "ScriptTask",
      isAbstract: true,
      extends: [
        "bpmn:ScriptTask"
      ],
      properties: [
        {
          name: "resultVariable",
          isAttr: true,
          type: "String"
        },
        {
          name: "resource",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "Process",
      isAbstract: true,
      extends: [
        "bpmn:Process"
      ],
      properties: [
        {
          name: "candidateStarterGroups",
          isAttr: true,
          type: "String"
        },
        {
          name: "candidateStarterUsers",
          isAttr: true,
          type: "String"
        },
        {
          name: "versionTag",
          isAttr: true,
          type: "String"
        },
        {
          name: "historyTimeToLive",
          isAttr: true,
          type: "String"
        },
        {
          name: "isStartableInTasklist",
          isAttr: true,
          type: "Boolean",
          default: true
        }
      ]
    },
    {
      name: "EscalationEventDefinitionExtension",
      isAbstract: true,
      extends: [
        "bpmn:EscalationEventDefinition"
      ],
      properties: [
        {
          name: "escalationCodeVariable",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "FormalExpression",
      isAbstract: true,
      extends: [
        "bpmn:FormalExpression"
      ],
      properties: [
        {
          name: "resource",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "Assignable",
      extends: ["bpmn:UserTask"],
      properties: [
        {
          name: "assignee",
          isAttr: true,
          type: "String"
        },
        {
          name: "candidateUsers",
          isAttr: true,
          type: "String"
        },
        {
          name: "candidateGroups",
          isAttr: true,
          type: "String"
        },
        {
          name: "dueDate",
          isAttr: true,
          type: "String"
        },
        {
          name: "followUpDate",
          isAttr: true,
          type: "String"
        },
        {
          name: "priority",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "CallActivity",
      extends: ["bpmn:CallActivity"],
      properties: [
        {
          name: "calledElementBinding",
          isAttr: true,
          type: "String",
          default: "latest"
        },
        {
          name: "calledElementVersion",
          isAttr: true,
          type: "String"
        },
        {
          name: "calledElementVersionTag",
          isAttr: true,
          type: "String"
        },
        {
          name: "calledElementTenantId",
          isAttr: true,
          type: "String"
        },
        {
          name: "caseRef",
          isAttr: true,
          type: "String"
        },
        {
          name: "caseBinding",
          isAttr: true,
          type: "String",
          default: "latest"
        },
        {
          name: "caseVersion",
          isAttr: true,
          type: "String"
        },
        {
          name: "caseTenantId",
          isAttr: true,
          type: "String"
        },
        {
          name: "variableMappingClass",
          isAttr: true,
          type: "String"
        },
        {
          name: "variableMappingDelegateExpression",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "ServiceTaskLike",
      extends: [
        "bpmn:ServiceTask",
        "bpmn:BusinessRuleTask",
        "bpmn:SendTask",
        "bpmn:MessageEventDefinition"
      ],
      properties: [
        {
          name: "expression",
          isAttr: true,
          type: "String"
        },
        {
          name: "class",
          isAttr: true,
          type: "String"
        },
        {
          name: "delegateExpression",
          isAttr: true,
          type: "String"
        },
        {
          name: "resultVariable",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "DmnCapable",
      extends: [
        "bpmn:BusinessRuleTask"
      ],
      properties: [
        {
          name: "decisionRef",
          isAttr: true,
          type: "String"
        },
        {
          name: "decisionRefBinding",
          isAttr: true,
          type: "String",
          default: "latest"
        },
        {
          name: "decisionRefVersion",
          isAttr: true,
          type: "String"
        },
        {
          name: "mapDecisionResult",
          isAttr: true,
          type: "String",
          default: "resultList"
        },
        {
          name: "decisionRefTenantId",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "ExternalCapable",
      extends: [
        "camunda:ServiceTaskLike"
      ],
      properties: [
        {
          name: "type",
          isAttr: true,
          type: "String"
        },
        {
          name: "topic",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "TaskPriorized",
      extends: [
        "bpmn:Process",
        "camunda:ExternalCapable"
      ],
      properties: [
        {
          name: "taskPriority",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "Properties",
      superClass: [
        "Element"
      ],
      meta: {
        allowedIn: ["*"]
      },
      properties: [
        {
          name: "values",
          type: "Property",
          isMany: true
        }
      ]
    },
    {
      name: "Property",
      superClass: [
        "Element"
      ],
      properties: [
        {
          name: "id",
          type: "String",
          isAttr: true
        },
        {
          name: "name",
          type: "String",
          isAttr: true
        },
        {
          name: "value",
          type: "String",
          isAttr: true
        }
      ]
    },
    {
      name: "Connector",
      superClass: [
        "Element"
      ],
      meta: {
        allowedIn: [
          "camunda:ServiceTaskLike"
        ]
      },
      properties: [
        {
          name: "inputOutput",
          type: "InputOutput"
        },
        {
          name: "connectorId",
          type: "String"
        }
      ]
    },
    {
      name: "InputOutput",
      superClass: [
        "Element"
      ],
      meta: {
        allowedIn: [
          "bpmn:FlowNode",
          "camunda:Connector"
        ]
      },
      properties: [
        {
          name: "inputOutput",
          type: "InputOutput"
        },
        {
          name: "connectorId",
          type: "String"
        },
        {
          name: "inputParameters",
          isMany: true,
          type: "InputParameter"
        },
        {
          name: "outputParameters",
          isMany: true,
          type: "OutputParameter"
        }
      ]
    },
    {
      name: "InputOutputParameter",
      properties: [
        {
          name: "name",
          isAttr: true,
          type: "String"
        },
        {
          name: "value",
          isBody: true,
          type: "String"
        },
        {
          name: "definition",
          type: "InputOutputParameterDefinition"
        }
      ]
    },
    {
      name: "InputOutputParameterDefinition",
      isAbstract: true
    },
    {
      name: "List",
      superClass: ["InputOutputParameterDefinition"],
      properties: [
        {
          name: "items",
          isMany: true,
          type: "InputOutputParameterDefinition"
        }
      ]
    },
    {
      name: "Map",
      superClass: ["InputOutputParameterDefinition"],
      properties: [
        {
          name: "entries",
          isMany: true,
          type: "Entry"
        }
      ]
    },
    {
      name: "Entry",
      properties: [
        {
          name: "key",
          isAttr: true,
          type: "String"
        },
        {
          name: "value",
          isBody: true,
          type: "String"
        },
        {
          name: "definition",
          type: "InputOutputParameterDefinition"
        }
      ]
    },
    {
      name: "Value",
      superClass: [
        "InputOutputParameterDefinition"
      ],
      properties: [
        {
          name: "id",
          isAttr: true,
          type: "String"
        },
        {
          name: "name",
          isAttr: true,
          type: "String"
        },
        {
          name: "value",
          isBody: true,
          type: "String"
        }
      ]
    },
    {
      name: "Script",
      superClass: ["InputOutputParameterDefinition"],
      properties: [
        {
          name: "scriptFormat",
          isAttr: true,
          type: "String"
        },
        {
          name: "resource",
          isAttr: true,
          type: "String"
        },
        {
          name: "value",
          isBody: true,
          type: "String"
        }
      ]
    },
    {
      name: "Field",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "camunda:ServiceTaskLike",
          "camunda:ExecutionListener",
          "camunda:TaskListener"
        ]
      },
      properties: [
        {
          name: "name",
          isAttr: true,
          type: "String"
        },
        {
          name: "expression",
          type: "String"
        },
        {
          name: "stringValue",
          isAttr: true,
          type: "String"
        },
        {
          name: "string",
          type: "String"
        }
      ]
    },
    {
      name: "InputParameter",
      superClass: ["InputOutputParameter"]
    },
    {
      name: "OutputParameter",
      superClass: ["InputOutputParameter"]
    },
    {
      name: "Collectable",
      isAbstract: true,
      extends: ["bpmn:MultiInstanceLoopCharacteristics"],
      superClass: ["camunda:AsyncCapable"],
      properties: [
        {
          name: "collection",
          isAttr: true,
          type: "String"
        },
        {
          name: "elementVariable",
          isAttr: true,
          type: "String"
        }
      ]
    },
    {
      name: "FailedJobRetryTimeCycle",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "camunda:AsyncCapable",
          "bpmn:MultiInstanceLoopCharacteristics"
        ]
      },
      properties: [
        {
          name: "body",
          isBody: true,
          type: "String"
        }
      ]
    },
    {
      name: "ExecutionListener",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "bpmn:Task",
          "bpmn:ServiceTask",
          "bpmn:UserTask",
          "bpmn:BusinessRuleTask",
          "bpmn:ScriptTask",
          "bpmn:ReceiveTask",
          "bpmn:ManualTask",
          "bpmn:ExclusiveGateway",
          "bpmn:SequenceFlow",
          "bpmn:ParallelGateway",
          "bpmn:InclusiveGateway",
          "bpmn:EventBasedGateway",
          "bpmn:StartEvent",
          "bpmn:IntermediateCatchEvent",
          "bpmn:IntermediateThrowEvent",
          "bpmn:EndEvent",
          "bpmn:BoundaryEvent",
          "bpmn:CallActivity",
          "bpmn:SubProcess",
          "bpmn:Process"
        ]
      },
      properties: [
        {
          name: "expression",
          isAttr: true,
          type: "String"
        },
        {
          name: "class",
          isAttr: true,
          type: "String"
        },
        {
          name: "delegateExpression",
          isAttr: true,
          type: "String"
        },
        {
          name: "event",
          isAttr: true,
          type: "String"
        },
        {
          name: "script",
          type: "Script"
        },
        {
          name: "fields",
          type: "Field",
          isMany: true
        }
      ]
    },
    {
      name: "TaskListener",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "bpmn:UserTask"
        ]
      },
      properties: [
        {
          name: "expression",
          isAttr: true,
          type: "String"
        },
        {
          name: "class",
          isAttr: true,
          type: "String"
        },
        {
          name: "delegateExpression",
          isAttr: true,
          type: "String"
        },
        {
          name: "event",
          isAttr: true,
          type: "String"
        },
        {
          name: "script",
          type: "Script"
        },
        {
          name: "fields",
          type: "Field",
          isMany: true
        },
        {
          name: "id",
          type: "String",
          isAttr: true
        },
        {
          name: "eventDefinitions",
          type: "bpmn:TimerEventDefinition",
          isMany: true
        }
      ]
    },
    {
      name: "FormProperty",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "bpmn:StartEvent",
          "bpmn:UserTask"
        ]
      },
      properties: [
        {
          name: "id",
          type: "String",
          isAttr: true
        },
        {
          name: "name",
          type: "String",
          isAttr: true
        },
        {
          name: "type",
          type: "String",
          isAttr: true
        },
        {
          name: "required",
          type: "String",
          isAttr: true
        },
        {
          name: "readable",
          type: "String",
          isAttr: true
        },
        {
          name: "writable",
          type: "String",
          isAttr: true
        },
        {
          name: "variable",
          type: "String",
          isAttr: true
        },
        {
          name: "expression",
          type: "String",
          isAttr: true
        },
        {
          name: "datePattern",
          type: "String",
          isAttr: true
        },
        {
          name: "default",
          type: "String",
          isAttr: true
        },
        {
          name: "values",
          type: "Value",
          isMany: true
        }
      ]
    },
    {
      name: "FormData",
      superClass: ["Element"],
      meta: {
        allowedIn: [
          "bpmn:StartEvent",
          "bpmn:UserTask"
        ]
      },
      properties: [
        {
          name: "fields",
          type: "FormField",
          isMany: true
        },
        {
          name: "businessKey",
          type: "String",
          isAttr: true
        }
      ]
    },
    {
      name: "FormField",
      superClass: ["Element"],
      properties: [
        {
          name: "id",
          type: "String",
          isAttr: true
        },
        {
          name: "label",
          type: "String",
          isAttr: true
        },
        {
          name: "type",
          type: "String",
          isAttr: true
        },
        {
          name: "datePattern",
          type: "String",
          isAttr: true
        },
        {
          name: "defaultValue",
          type: "String",
          isAttr: true
        },
        {
          name: "properties",
          type: "Properties"
        },
        {
          name: "validation",
          type: "Validation"
        },
        {
          name: "values",
          type: "Value",
          isMany: true
        }
      ]
    },
    {
      name: "Validation",
      superClass: ["Element"],
      properties: [
        {
          name: "constraints",
          type: "Constraint",
          isMany: true
        }
      ]
    },
    {
      name: "Constraint",
      superClass: ["Element"],
      properties: [
        {
          name: "name",
          type: "String",
          isAttr: true
        },
        {
          name: "config",
          type: "String",
          isAttr: true
        }
      ]
    },
    {
      name: "ConditionalEventDefinitionExtension",
      isAbstract: true,
      extends: [
        "bpmn:ConditionalEventDefinition"
      ],
      properties: [
        {
          name: "variableName",
          isAttr: true,
          type: "String"
        },
        {
          name: "variableEvents",
          isAttr: true,
          type: "String"
        }
      ]
    }
  ],
  emumerations: []
};

// src/bpmn/moddle.ts
function createBpmnModdle() {
  return new SimpleBpmnModdle({ camunda: camunda_default });
}

// src/bpmn/loadBpmn.ts
async function loadBpmn(filePath) {
  let xml2;
  try {
    xml2 = await (0, import_promises2.readFile)(filePath, "utf8");
  } catch (error3) {
    const nodeError = error3;
    throw new BpmnCliError(
      nodeError.code === "ENOENT" ? "FILE_NOT_FOUND" : "FILE_READ_ERROR",
      nodeError.code === "ENOENT" ? "File not found" : "Cannot read file",
      3,
      { filePath }
    );
  }
  try {
    const moddle = createBpmnModdle();
    const { rootElement, warnings } = await moddle.fromXML(xml2);
    const definitions = rootElement;
    const rootElements = arrayOf(definitions.rootElements);
    return {
      filePath,
      xml: xml2,
      definitions,
      rootElements,
      processes: rootElements.filter((element) => element.$type === "bpmn:Process"),
      collaborations: rootElements.filter((element) => element.$type === "bpmn:Collaboration"),
      warnings: warnings.map((warning) => ({ message: warning.message ?? "BPMN parser warning" }))
    };
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "BPMN/XML parse error", 4, {
      filePath,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}

// src/bpmn/normalize.ts
function normalizeName(value) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function stringValue(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
function arrayOf2(value) {
  return Array.isArray(value) ? value : [];
}

// src/index/buildIndexes.ts
var FLOW_NODE_TYPES = /* @__PURE__ */ new Set([
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:BoundaryEvent",
  "bpmn:Task",
  "bpmn:UserTask",
  "bpmn:ServiceTask",
  "bpmn:ScriptTask",
  "bpmn:BusinessRuleTask",
  "bpmn:SendTask",
  "bpmn:ReceiveTask",
  "bpmn:ManualTask",
  "bpmn:CallActivity",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:ExclusiveGateway",
  "bpmn:ParallelGateway",
  "bpmn:InclusiveGateway",
  "bpmn:EventBasedGateway"
]);
var SUBPROCESS_TYPES = /* @__PURE__ */ new Set([
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction"
]);
function buildIndexes(model) {
  const indexes = {
    rawById: /* @__PURE__ */ new Map(),
    byId: /* @__PURE__ */ new Map(),
    byNormalizedName: /* @__PURE__ */ new Map(),
    byType: /* @__PURE__ */ new Map(),
    byProcessId: /* @__PURE__ */ new Map(),
    incomingByNodeId: /* @__PURE__ */ new Map(),
    outgoingByNodeId: /* @__PURE__ */ new Map(),
    sequenceFlowById: /* @__PURE__ */ new Map(),
    messageFlowById: /* @__PURE__ */ new Map(),
    boundaryEventsByAttachedToId: /* @__PURE__ */ new Map(),
    childrenBySubprocessId: /* @__PURE__ */ new Map(),
    participantByProcessId: /* @__PURE__ */ new Map(),
    lanesById: /* @__PURE__ */ new Map(),
    lanesByProcessId: /* @__PURE__ */ new Map(),
    lanesByElementId: /* @__PURE__ */ new Map(),
    implementationsByElementId: /* @__PURE__ */ new Map(),
    subprocessParentByChildId: /* @__PURE__ */ new Map()
  };
  const elementsById = /* @__PURE__ */ new Map();
  for (const process2 of sortElements(model.processes)) {
    const processId = idOf(process2);
    if (!processId) {
      continue;
    }
    for (const laneSet of arrayOf2(process2.laneSets)) {
      indexLaneSet(indexes, laneSet, processId);
    }
    indexFlowElements(indexes, elementsById, arrayOf2(process2.flowElements), processId, null);
  }
  for (const collaboration of sortElements(model.collaborations)) {
    for (const participant of sortElements(arrayOf2(collaboration.participants))) {
      const summary = summarizeParticipant(participant);
      if (summary.processId) {
        indexes.participantByProcessId.set(summary.processId, summary);
      }
    }
    for (const flow of sortElements(arrayOf2(collaboration.messageFlows))) {
      const summary = summarizeMessageFlow(flow);
      if (summary) {
        indexes.messageFlowById.set(summary.id, summary);
      }
    }
  }
  for (const flow of indexes.sequenceFlowById.values()) {
    pushMap(indexes.outgoingByNodeId, flow.sourceId, flow);
    pushMap(indexes.incomingByNodeId, flow.targetId, flow);
  }
  sortIndexArrays(indexes);
  return indexes;
}
function summarizeElement(element, processId = null) {
  return {
    id: String(element.id),
    type: String(element.$type),
    name: stringValue(element.name),
    processId
  };
}
function indexFlowElements(indexes, elementsById, flowElements, processId, subprocessId) {
  for (const element of sortElements(flowElements)) {
    const id = idOf(element);
    const type = element.$type;
    if (!id || !type) {
      continue;
    }
    elementsById.set(id, element);
    indexes.rawById.set(id, element);
    if (type === "bpmn:SequenceFlow") {
      const summary2 = summarizeSequenceFlow(element);
      if (summary2) {
        indexes.sequenceFlowById.set(summary2.id, summary2);
        addElementSummary(indexes, { id, type, name: stringValue(element.name), processId });
      }
      continue;
    }
    if (!FLOW_NODE_TYPES.has(type)) {
      continue;
    }
    const summary = summarizeElement(element, processId);
    addElementSummary(indexes, summary);
    if (subprocessId) {
      pushMap(indexes.childrenBySubprocessId, subprocessId, summary);
      indexes.subprocessParentByChildId.set(id, subprocessId);
    }
    if (type === "bpmn:BoundaryEvent") {
      const attachedToId = idOf(element.attachedToRef);
      if (attachedToId) {
        pushMap(indexes.boundaryEventsByAttachedToId, attachedToId, {
          ...summary,
          eventDefinitionType: eventDefinitionType(element)
        });
      }
    }
    for (const implementation of summarizeImplementations(element)) {
      pushMap(indexes.implementationsByElementId, id, implementation);
    }
    if (SUBPROCESS_TYPES.has(type)) {
      indexFlowElements(indexes, elementsById, arrayOf2(element.flowElements), processId, id);
    }
  }
}
function addElementSummary(indexes, summary) {
  indexes.byId.set(summary.id, summary);
  pushMap(indexes.byType, summary.type, summary);
  if (summary.processId) {
    pushMap(indexes.byProcessId, summary.processId, summary);
  }
  const normalizedName = normalizeName(summary.name);
  if (normalizedName) {
    pushMap(indexes.byNormalizedName, normalizedName, summary);
  }
}
function summarizeSequenceFlow(flow) {
  const id = idOf(flow);
  const sourceId = idOf(flow.sourceRef);
  const targetId = idOf(flow.targetRef);
  if (!id || !sourceId || !targetId) {
    return null;
  }
  return {
    id,
    type: "bpmn:SequenceFlow",
    name: stringValue(flow.name),
    sourceId,
    sourceName: null,
    targetId,
    targetName: null,
    condition: conditionText(flow.conditionExpression)
  };
}
function summarizeMessageFlow(flow) {
  const id = idOf(flow);
  if (!id) {
    return null;
  }
  return {
    id,
    type: "bpmn:MessageFlow",
    name: stringValue(flow.name),
    sourceId: idOf(flow.sourceRef),
    sourceName: null,
    targetId: idOf(flow.targetRef),
    targetName: null
  };
}
function summarizeParticipant(participant) {
  return {
    id: String(participant.id),
    name: stringValue(participant.name),
    processId: idOf(participant.processRef)
  };
}
function summarizeImplementations(element) {
  const summaries = [];
  const elementId = idOf(element);
  const elementType = element.$type;
  if (!elementId || !elementType) {
    return summaries;
  }
  const base = {
    elementId,
    elementName: stringValue(element.name),
    elementType,
    asyncBefore: booleanValue(element.asyncBefore),
    asyncAfter: booleanValue(element.asyncAfter),
    exclusive: booleanValue(element.exclusive)
  };
  addValueImplementation(summaries, base, "delegateExpression", element.delegateExpression);
  addValueImplementation(summaries, base, "class", element.class);
  addValueImplementation(summaries, base, "expression", element.expression);
  if (element.type === "external") {
    summaries.push(cleanImplementation({
      ...base,
      kind: "externalTask",
      topic: stringValue(element.topic) ?? void 0
    }));
  }
  addValueImplementation(summaries, base, "form", element.formKey);
  const calledElement = stringValue(element.calledElement);
  if (elementType === "bpmn:CallActivity" && calledElement) {
    summaries.push(cleanImplementation({
      ...base,
      kind: "callActivity",
      value: calledElement
    }));
  }
  const extensionValues = arrayOf2(element.extensionElements?.values);
  for (const extension of extensionValues) {
    if (extension.$type === "camunda:ExecutionListener" || extension.$type === "camunda:TaskListener") {
      const listener = listenerImplementation(base, extension);
      if (listener) {
        summaries.push(listener);
      }
    }
  }
  return summaries.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}
function addValueImplementation(summaries, base, kind, value) {
  const string = stringValue(value);
  if (!string) {
    return;
  }
  summaries.push(cleanImplementation({
    ...base,
    kind,
    value: string
  }));
}
function listenerImplementation(base, extension) {
  const value = stringValue(extension.delegateExpression) ?? stringValue(extension.class) ?? stringValue(extension.expression);
  if (!value) {
    return null;
  }
  return cleanImplementation({
    ...base,
    kind: "listener",
    value,
    details: {
      event: stringValue(extension.event),
      listenerType: extension.$type
    }
  });
}
function cleanImplementation(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== void 0));
}
function indexLaneSet(indexes, laneSet, processId) {
  for (const lane of sortElements(arrayOf2(laneSet.lanes))) {
    const summary = {
      id: String(lane.id),
      name: stringValue(lane.name),
      processId,
      flowNodeIds: arrayOf2(lane.flowNodeRef).map(idOf).filter((id) => Boolean(id)).sort()
    };
    indexes.lanesById.set(summary.id, summary);
    pushMap(indexes.lanesByProcessId, processId, summary);
    for (const flowNodeId of summary.flowNodeIds) {
      pushMap(indexes.lanesByElementId, flowNodeId, summary);
    }
    for (const childLaneSet of arrayOf2(lane.childLaneSet ? [lane.childLaneSet] : [])) {
      indexLaneSet(indexes, childLaneSet, processId);
    }
  }
}
function eventDefinitionType(element) {
  return arrayOf2(element.eventDefinitions)[0]?.$type ?? null;
}
function conditionText(value) {
  if (!isRecord(value)) {
    return null;
  }
  return stringValue(value.body);
}
function booleanValue(value) {
  return typeof value === "boolean" ? value : void 0;
}
function idOf(value) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (isRecord(value) && typeof value.id === "string" && value.id.trim() !== "") {
    return value.id;
  }
  return null;
}
function pushMap(map, key, value) {
  map.set(key, [...map.get(key) ?? [], value]);
}
function sortIndexArrays(indexes) {
  for (const map of [
    indexes.byNormalizedName,
    indexes.byType,
    indexes.byProcessId,
    indexes.incomingByNodeId,
    indexes.outgoingByNodeId,
    indexes.boundaryEventsByAttachedToId,
    indexes.childrenBySubprocessId,
    indexes.lanesByProcessId,
    indexes.lanesByElementId,
    indexes.implementationsByElementId
  ]) {
    for (const [key, values] of map.entries()) {
      map.set(key, [...values].sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
    }
  }
}
function sortElements(items) {
  return [...items].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}
function sortKey(value) {
  if (!isRecord(value)) {
    return String(value);
  }
  return [value.id, value.elementId, value.type ?? value.$type, value.kind, value.name].map((item) => typeof item === "string" ? item : "").join("|");
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

// src/write/addBoundaryEvent.ts
var ACTIVITY_TYPES = /* @__PURE__ */ new Set([
  "bpmn:Task",
  "bpmn:UserTask",
  "bpmn:ServiceTask",
  "bpmn:ManualTask",
  "bpmn:ScriptTask",
  "bpmn:BusinessRuleTask",
  "bpmn:SendTask",
  "bpmn:ReceiveTask",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:CallActivity"
]);
var XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";
function addBoundaryEventXml(args) {
  const attachedTo = requireElement(args.indexes, args.attachedToId, "attachedToId");
  const target = requireElement(args.indexes, args.targetId, "targetId");
  if (!ACTIVITY_TYPES.has(attachedTo.type)) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Boundary events can only be attached to activity-like elements in P3-D", 1, {
      attachedToId: args.attachedToId,
      type: attachedTo.type
    });
  }
  if (target.type === "bpmn:SequenceFlow") {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Boundary event target must be a flow node", 1, { targetId: args.targetId });
  }
  assertNewId(args.indexes, args.boundaryEventId, "boundaryEventId");
  assertNewId(args.indexes, args.flowId, "flowId");
  const cancelActivity = args.cancelActivity ?? true;
  const boundaryEvent = {
    id: args.boundaryEventId,
    type: "bpmn:BoundaryEvent",
    name: args.name ?? null,
    processId: attachedTo.processId,
    eventDefinitionType: "bpmn:TimerEventDefinition"
  };
  const flow = {
    id: args.flowId,
    type: "bpmn:SequenceFlow",
    name: null,
    sourceId: args.boundaryEventId,
    sourceName: args.name ?? null,
    targetId: target.id,
    targetName: target.name,
    condition: null
  };
  let xml2 = args.xml;
  xml2 = ensureXsiNamespace(xml2);
  xml2 = appendIncoming(xml2, target.id, args.flowId);
  xml2 = insertBoundaryAfterAttached(xml2, attachedTo.id, boundaryEvent, flow, args.duration, cancelActivity);
  return {
    xml: xml2,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      boundaryEvent,
      attachedTo,
      target,
      flow,
      timer: {
        duration: args.duration,
        cancelActivity
      },
      warnings: [{
        severity: "warning",
        code: "DI_NOT_UPDATED",
        message: "BPMNDI layout is not updated in P3-D"
      }],
      diff: [
        {
          op: "add",
          path: `/boundaryEvents/${args.boundaryEventId}`,
          before: null,
          after: attachedTo.id
        },
        {
          op: "add",
          path: `/sequenceFlows/${args.flowId}`,
          before: null,
          after: `${args.boundaryEventId}->${target.id}`
        },
        {
          op: "add",
          path: `/elements/${target.id}/incoming`,
          before: null,
          after: args.flowId
        }
      ]
    }
  };
}
function requireElement(indexes, id, field) {
  const element = indexes.byId.get(id);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { [field]: id });
  }
  return element;
}
function assertNewId(indexes, id, field) {
  if (indexes.byId.has(id) || indexes.sequenceFlowById.has(id)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `Duplicate id for ${field}`, 2, { [field]: id });
  }
}
function ensureXsiNamespace(xml2) {
  if (xml2.includes("xmlns:xsi=")) {
    return xml2;
  }
  const definitionsPattern = /<bpmn:definitions\b[^>]*>/;
  const match = xml2.match(definitionsPattern);
  if (!match || match.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find bpmn:definitions opening tag", 1);
  }
  const tag = match[0].replace(/>$/, ` xmlns:xsi="${XSI_NS}">`);
  return `${xml2.slice(0, match.index)}${tag}${xml2.slice(match.index + match[0].length)}`;
}
function appendIncoming(xml2, targetId, flowId) {
  const section = findElementSection(xml2, targetId);
  const lineStart = xml2.lastIndexOf("\n", section.closeIndex) + 1;
  const indent = xml2.slice(lineStart, section.closeIndex).match(/^\s*/)?.[0] ?? "";
  const insertion = `${indent}  <bpmn:incoming>${escapeText(flowId)}</bpmn:incoming>
`;
  return `${xml2.slice(0, section.closeIndex)}${insertion}${xml2.slice(section.closeIndex)}`;
}
function insertBoundaryAfterAttached(xml2, attachedToId, boundaryEvent, flow, duration, cancelActivity) {
  const section = findElementSection(xml2, attachedToId);
  const afterClose = section.endIndex;
  const lineStart = xml2.lastIndexOf("\n", section.openIndex) + 1;
  const indent = xml2.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? "";
  const name2 = boundaryEvent.name ? ` name="${escapeAttribute(boundaryEvent.name)}"` : "";
  const cancel = cancelActivity ? "" : ' cancelActivity="false"';
  const boundaryXml = [
    `<bpmn:boundaryEvent id="${escapeAttribute(boundaryEvent.id)}"${name2} attachedToRef="${escapeAttribute(attachedToId)}"${cancel}>`,
    `${indent}  <bpmn:outgoing>${escapeText(flow.id)}</bpmn:outgoing>`,
    `${indent}  <bpmn:timerEventDefinition>`,
    `${indent}    <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">${escapeText(duration)}</bpmn:timeDuration>`,
    `${indent}  </bpmn:timerEventDefinition>`,
    `${indent}</bpmn:boundaryEvent>`,
    `${indent}<bpmn:sequenceFlow id="${escapeAttribute(flow.id)}" sourceRef="${escapeAttribute(flow.sourceId)}" targetRef="${escapeAttribute(flow.targetId)}" />`
  ].join(`
${indent}`);
  return `${xml2.slice(0, afterClose)}
${indent}${boundaryXml}${xml2.slice(afterClose)}`;
}
function findElementSection(xml2, elementId) {
  const escapedId = escapeRegExp(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml2.match(openPattern);
  if (!open || open.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target XML element", 1, { elementId });
  }
  if (open[0].endsWith("/>")) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Self-closing target elements are not supported in P3-D", 1, { elementId });
  }
  const closeTag = `</${open[1]}>`;
  const closeIndex = xml2.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target XML closing tag", 1, { elementId });
  }
  return {
    openIndex: open.index,
    closeIndex,
    endIndex: closeIndex + closeTag.length
  };
}
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/addBoundaryEventCommand.ts
async function addBoundaryEventCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "add-boundary-event requires a BPMN file", 2);
  }
  const attachedToId = requiredString(args, "--attached-to", "add-boundary-event requires --attached-to");
  const boundaryEventId = requiredString(args, "--id", "add-boundary-event requires --id");
  const targetId = requiredString(args, "--target", "add-boundary-event requires --target");
  const flowId = requiredString(args, "--flow-id", "add-boundary-event requires --flow-id");
  const duration = requiredString(args, "--duration", "add-boundary-event requires --duration");
  const name2 = args.options.get("--name");
  if (name2 !== void 0 && typeof name2 !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--name requires a value", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = addBoundaryEventXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    attachedToId,
    boundaryEventId,
    targetId,
    flowId,
    duration,
    name: name2 ?? null,
    cancelActivity: args.options.get("--non-interrupting") === true ? false : true,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml(plan.xml);
  if (write) {
    await writeOutput(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "add-boundary-event",
    file: args.file,
    result: plan.result
  });
}
function requiredString(args, key, message) {
  const value = args.options.get(key);
  if (typeof value !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", message, 2);
  }
  return value;
}
async function validateXml(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput(path, payload) {
  try {
    await (0, import_promises3.mkdir)((0, import_node_path2.dirname)(path), { recursive: true });
    await (0, import_promises3.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write boundary event BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/query/elementDetails.ts
function getElementDetails(indexes, element) {
  const raw = indexes.rawById.get(element.id);
  if (!raw) {
    return void 0;
  }
  if (element.type === "bpmn:CallActivity") {
    return callActivityDetails(raw);
  }
  if (element.type === "bpmn:ServiceTask") {
    return serviceTaskDetails(raw);
  }
  if (element.type === "bpmn:UserTask") {
    return userTaskDetails(raw);
  }
  if (element.type === "bpmn:SequenceFlow") {
    return sequenceFlowDetails(raw);
  }
  if (element.type === "bpmn:BoundaryEvent") {
    return boundaryEventDetails(indexes, raw);
  }
  return void 0;
}
function callActivityDetails(element) {
  const extensionValues = arrayOf2(element.extensionElements?.values);
  const mappings = extensionValues.map(mappingSummary).filter((mapping) => Boolean(mapping));
  const inputMappings = mappings.filter((mapping) => mapping.direction === "in");
  const outputMappings = mappings.filter((mapping) => mapping.direction === "out");
  const variableCandidates = variableCandidatesFromMappings(mappings);
  return {
    kind: "callActivity",
    calledElement: stringValue(element.calledElement),
    inputMappings,
    outputMappings,
    variableCandidates,
    warnings: []
  };
}
function mappingSummary(element) {
  if (element.$type !== "camunda:In" && element.$type !== "camunda:Out") {
    return null;
  }
  const direction = element.$type === "camunda:In" ? "in" : "out";
  return clean({
    direction,
    source: stringValue(element.source) ?? void 0,
    sourceExpression: stringValue(element.sourceExpression) ?? void 0,
    target: stringValue(element.target) ?? void 0,
    variables: stringValue(element.variables) ?? void 0,
    businessKey: stringValue(element.businessKey) ?? void 0,
    local: booleanValue2(element.local)
  });
}
function serviceTaskDetails(element) {
  const expressions = [
    stringValue(element.delegateExpression),
    stringValue(element.class),
    stringValue(element.expression),
    stringValue(element.topic)
  ].filter((value) => Boolean(value));
  return {
    kind: "serviceTask",
    implementation: {
      type: stringValue(element.type),
      topic: stringValue(element.topic),
      delegateExpression: stringValue(element.delegateExpression),
      class: stringValue(element.class),
      expression: stringValue(element.expression)
    },
    variableCandidates: variableCandidatesFromValues(expressions)
  };
}
function userTaskDetails(element) {
  const formKey = stringValue(element.formKey);
  return {
    kind: "userTask",
    formKey,
    variableCandidates: variableCandidatesFromValues(formKey ? [formKey] : [])
  };
}
function sequenceFlowDetails(element) {
  const condition = conditionText2(element.conditionExpression);
  return {
    kind: "sequenceFlow",
    condition,
    variableCandidates: variableCandidatesFromValues(condition ? [condition] : [])
  };
}
function boundaryEventDetails(indexes, element) {
  const attachedToId = idOf2(element.attachedToRef);
  return {
    kind: "boundaryEvent",
    attachedTo: attachedToId ? indexes.byId.get(attachedToId) ?? null : null,
    cancelActivity: booleanValue2(element.cancelActivity) ?? null,
    eventDefinitions: arrayOf2(element.eventDefinitions).map(eventDefinitionSummary)
  };
}
function eventDefinitionSummary(element) {
  return clean({
    type: String(element.$type),
    value: timerValue(element) ?? void 0,
    refId: idOf2(element.messageRef) ?? idOf2(element.errorRef) ?? idOf2(element.signalRef) ?? idOf2(element.escalationRef) ?? void 0,
    refName: nameOf(element.messageRef) ?? nameOf(element.errorRef) ?? nameOf(element.signalRef) ?? nameOf(element.escalationRef) ?? void 0
  });
}
function timerValue(element) {
  return expressionBody(element.timeDuration) ?? expressionBody(element.timeDate) ?? expressionBody(element.timeCycle);
}
function expressionBody(value) {
  if (!isRecord2(value)) {
    return null;
  }
  return stringValue(value.body);
}
function conditionText2(value) {
  return expressionBody(value);
}
function variableCandidatesFromMappings(mappings) {
  const values = mappings.flatMap((mapping) => [
    mapping.source,
    mapping.sourceExpression,
    mapping.target,
    mapping.businessKey
  ]).filter((value) => Boolean(value));
  return variableCandidatesFromValues(values);
}
function variableCandidatesFromValues(values) {
  const candidates = /* @__PURE__ */ new Set();
  for (const value of values) {
    for (const candidate of extractVariableCandidates(value)) {
      candidates.add(candidate);
    }
  }
  return [...candidates].sort((a, b) => a.localeCompare(b));
}
function extractVariableCandidates(value) {
  const withoutStrings = value.replace(/'[^']*'|"[^"]*"/g, " ");
  const tokens = withoutStrings.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [];
  const reserved = /* @__PURE__ */ new Set(["all", "and", "or", "not", "true", "false", "null"]);
  return tokens.filter((token) => !reserved.has(token));
}
function booleanValue2(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return void 0;
}
function idOf2(value) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (isRecord2(value) && typeof value.id === "string" && value.id.trim() !== "") {
    return value.id;
  }
  return null;
}
function nameOf(value) {
  return isRecord2(value) ? stringValue(value.name) : null;
}
function clean(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== void 0));
}
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}

// src/query/callActivity.ts
function getCallActivities(indexes, args) {
  const elements = args.id ? [requiredCallActivity(indexes, args.id)] : [...indexes.byType.get("bpmn:CallActivity") ?? []].sort(compareElement);
  const callActivities = elements.map((element) => buildContract(indexes, element));
  const usages = callActivities.flatMap((contract) => variableUsages(contract));
  return {
    callActivities,
    variables: summarizeVariables(usages),
    warnings: [...new Set(callActivities.flatMap((contract) => contract.warnings))].sort((a, b) => a.localeCompare(b))
  };
}
function requiredCallActivity(indexes, id) {
  const element = indexes.byId.get(id);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: id }, suggestions(indexes, id));
  }
  if (element.type !== "bpmn:CallActivity") {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Element is not a CallActivity", 1, {
      elementId: id,
      type: element.type,
      expectedType: "bpmn:CallActivity"
    });
  }
  return element;
}
function buildContract(indexes, element) {
  const details = getElementDetails(indexes, element);
  if (!details || details.kind !== "callActivity") {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Element is not a CallActivity", 1, {
      elementId: element.id,
      type: element.type,
      expectedType: "bpmn:CallActivity"
    });
  }
  const mappings = [...details.inputMappings, ...details.outputMappings];
  const variableNames = variableCandidatesFromMappings(mappings);
  const passThrough = details.outputMappings.some((mapping) => mapping.variables === "all");
  if (passThrough) {
    variableNames.unshift("*");
  }
  return {
    element,
    calledElement: details.calledElement,
    inputMappings: details.inputMappings,
    outputMappings: details.outputMappings,
    variables: [...new Set(variableNames)].sort((a, b) => a.localeCompare(b)),
    passThrough,
    businessKey: mappings.find((mapping) => mapping.businessKey)?.businessKey ?? null,
    warnings: details.warnings
  };
}
function variableUsages(contract) {
  return [...contract.inputMappings, ...contract.outputMappings].flatMap((mapping) => {
    const names = mapping.variables === "all" ? ["*"] : variableCandidatesFromMappings([mapping]);
    const direction = mapping.variables === "all" ? "pass-through" : mapping.direction;
    return names.map((name2) => clean2({
      name: name2,
      direction,
      source: "callActivityMapping",
      element: contract.element,
      expression: mapping.sourceExpression,
      mapping
    }));
  });
}
function summarizeVariables(usages) {
  const byName = /* @__PURE__ */ new Map();
  for (const usage of usages) {
    byName.set(usage.name, [...byName.get(usage.name) ?? [], usage]);
  }
  return [...byName.entries()].map(([name2, items]) => ({
    name: name2,
    usageCount: items.length,
    directions: [...new Set(items.map((item) => item.direction))].sort(compareDirection),
    elements: uniqueElements(items.map((item) => item.element))
  })).sort((a, b) => a.name.localeCompare(b.name));
}
function uniqueElements(elements) {
  const byId = /* @__PURE__ */ new Map();
  for (const element of elements) {
    byId.set(element.id, element);
  }
  return [...byId.values()].sort(compareElement);
}
function suggestions(indexes, query) {
  const normalized = query.toLocaleLowerCase();
  return [...indexes.byId.values()].map((element) => ({
    ...element,
    score: element.id.toLocaleLowerCase().includes(normalized) ? 0.7 : (element.name ?? "").toLocaleLowerCase().includes(normalized) ? 0.5 : 0
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 5);
}
function compareElement(a, b) {
  return a.id.localeCompare(b.id);
}
function compareDirection(a, b) {
  const order = ["in", "out", "read", "write", "pass-through", "unknown"];
  return order.indexOf(a) - order.indexOf(b);
}
function clean2(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== void 0));
}

// src/cli/commands/callActivityCommand.ts
async function callActivityCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "call-activity requires a BPMN file", 2);
  }
  const id = args.options.get("--id");
  if (id !== void 0 && typeof id !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "call-activity --id requires a value", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "call-activity",
    file: args.file,
    result: getCallActivities(buildIndexes(model), { id })
  });
}

// src/cli/commands/connectCommand.ts
var import_promises4 = require("node:fs/promises");
var import_node_path3 = require("node:path");

// src/write/connectElements.ts
function connectElementsXml(args) {
  const source = requireElement2(args.indexes, args.sourceId, "sourceId");
  const target = requireElement2(args.indexes, args.targetId, "targetId");
  if (source.type === "bpmn:SequenceFlow" || target.type === "bpmn:SequenceFlow") {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "connect endpoints must be flow nodes, not sequence flows", 1, {
      sourceId: args.sourceId,
      targetId: args.targetId
    });
  }
  if (args.indexes.byId.has(args.flowId) || args.indexes.sequenceFlowById.has(args.flowId)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "Duplicate sequence flow id", 2, { flowId: args.flowId });
  }
  const flow = {
    id: args.flowId,
    type: "bpmn:SequenceFlow",
    name: args.name ?? null,
    sourceId: source.id,
    sourceName: source.name,
    targetId: target.id,
    targetName: target.name,
    condition: null
  };
  let xml2 = args.xml;
  xml2 = appendFlowReference(xml2, source.id, "outgoing", flow.id);
  xml2 = appendFlowReference(xml2, target.id, "incoming", flow.id);
  xml2 = insertSequenceFlowAfterElement(xml2, source.id, flow);
  return {
    xml: xml2,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      flow,
      source,
      target,
      warnings: [{
        severity: "warning",
        code: "DI_NOT_UPDATED",
        message: "BPMNDI layout is not updated in P3-B"
      }],
      diff: [
        {
          op: "add",
          path: `/sequenceFlows/${flow.id}`,
          before: null,
          after: `${source.id}->${target.id}`
        },
        {
          op: "add",
          path: `/elements/${source.id}/outgoing`,
          before: null,
          after: flow.id
        },
        {
          op: "add",
          path: `/elements/${target.id}/incoming`,
          before: null,
          after: flow.id
        }
      ]
    }
  };
}
function requireElement2(indexes, id, field) {
  const element = indexes.byId.get(id);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { [field]: id });
  }
  return element;
}
function appendFlowReference(xml2, elementId, direction, flowId) {
  const section = findElementSection2(xml2, elementId);
  const lineStart = xml2.lastIndexOf("\n", section.closeIndex) + 1;
  const indent = xml2.slice(lineStart, section.closeIndex).match(/^\s*/)?.[0] ?? "";
  const insertion = `${indent}  <bpmn:${direction}>${escapeText2(flowId)}</bpmn:${direction}>
`;
  return `${xml2.slice(0, section.closeIndex)}${insertion}${xml2.slice(section.closeIndex)}`;
}
function insertSequenceFlowAfterElement(xml2, sourceId, flow) {
  const section = findElementSection2(xml2, sourceId);
  const afterClose = section.closeIndex + section.closeTag.length;
  const lineStart = xml2.lastIndexOf("\n", section.openIndex) + 1;
  const indent = xml2.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? "";
  const name2 = flow.name ? ` name="${escapeAttribute2(flow.name)}"` : "";
  const flowXml = `
${indent}<bpmn:sequenceFlow id="${escapeAttribute2(flow.id)}"${name2} sourceRef="${escapeAttribute2(flow.sourceId)}" targetRef="${escapeAttribute2(flow.targetId)}" />`;
  return `${xml2.slice(0, afterClose)}${flowXml}${xml2.slice(afterClose)}`;
}
function findElementSection2(xml2, elementId) {
  const escapedId = escapeRegExp2(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml2.match(openPattern);
  if (!open || open.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find flow node opening tag", 1, { elementId });
  }
  if (open[0].endsWith("/>")) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Self-closing flow nodes are not supported by connect in P3-B", 1, { elementId });
  }
  const closeTag = `</${open[1]}>`;
  const closeIndex = xml2.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find flow node closing tag", 1, { elementId });
  }
  return { openIndex: open.index, closeIndex, closeTag };
}
function escapeAttribute2(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeText2(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp2(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/connectCommand.ts
async function connectCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "connect requires a BPMN file", 2);
  }
  const sourceId = requiredString2(args, "--from", "connect requires --from");
  const targetId = requiredString2(args, "--to", "connect requires --to");
  const flowId = requiredString2(args, "--id", "connect requires --id");
  const name2 = args.options.get("--name");
  if (name2 !== void 0 && typeof name2 !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--name requires a value", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = connectElementsXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    sourceId,
    targetId,
    flowId,
    name: name2 ?? null,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml2(plan.xml);
  if (write) {
    await writeOutput2(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "connect",
    file: args.file,
    result: plan.result
  });
}
function requiredString2(args, key, message) {
  const value = args.options.get(key);
  if (typeof value !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", message, 2);
  }
  return value;
}
async function validateXml2(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput2(path, payload) {
  try {
    await (0, import_promises4.mkdir)((0, import_node_path3.dirname)(path), { recursive: true });
    await (0, import_promises4.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write connected BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/query/trace.ts
function trace(indexes, args) {
  const start = indexes.byId.get(args.from);
  if (!start) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.from });
  }
  const traversal = collectPaths(indexes, start, args.direction, args.depth, args.maxPaths);
  return {
    from: start,
    direction: args.direction,
    depth: args.depth,
    paths: traversal.paths,
    truncated: traversal.truncated
  };
}
function collectPaths(indexes, start, direction, depth, maxPaths) {
  const paths = [];
  let truncated = false;
  function visit(nodes, flows, remainingDepth, seen, cycleDetected = false) {
    const current = nodes[nodes.length - 1];
    const nextFlows2 = direction === "forward" ? indexes.outgoingByNodeId.get(current.id) ?? [] : indexes.incomingByNodeId.get(current.id) ?? [];
    if (remainingDepth === 0 || nextFlows2.length === 0 || cycleDetected) {
      if (paths.length < maxPaths) {
        paths.push({ nodes, flows, depth: flows.length, cycleDetected: cycleDetected || void 0 });
      } else {
        truncated = true;
      }
      return;
    }
    for (const flow of nextFlows2) {
      if (paths.length >= maxPaths) {
        truncated = true;
        return;
      }
      const nextId = direction === "forward" ? flow.targetId : flow.sourceId;
      const next = indexes.byId.get(nextId);
      if (!next) {
        continue;
      }
      const repeated = seen.has(next.id);
      visit(
        [...nodes, next],
        [...flows, { id: flow.id, name: flow.name, condition: flow.condition }],
        remainingDepth - 1,
        /* @__PURE__ */ new Set([...seen, next.id]),
        repeated
      );
    }
  }
  visit([start], [], depth, /* @__PURE__ */ new Set([start.id]));
  return { paths, truncated };
}

// src/query/context.ts
function getContext(indexes, args) {
  const focus = indexes.byId.get(args.id);
  if (!focus) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.id });
  }
  const before = collectPaths(indexes, focus, "backward", args.before, args.maxPaths);
  const after = collectPaths(indexes, focus, "forward", args.after, args.maxPaths);
  return {
    focus,
    before: before.paths.map(reversePath),
    after: after.paths,
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(focus.id) ?? [],
    truncated: before.truncated || after.truncated
  };
}
function reversePath(path) {
  return {
    ...path,
    nodes: [...path.nodes].reverse(),
    flows: [...path.flows].reverse()
  };
}

// src/cli/commands/contextCommand.ts
async function contextCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "context requires a BPMN file", 2);
  }
  const id = args.options.get("--id");
  if (typeof id !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "context requires --id", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "context",
    file: args.file,
    result: getContext(buildIndexes(model), {
      id,
      before: numberOption(args, "--before", 2),
      after: numberOption(args, "--after", 2),
      maxPaths: numberOption(args, "--max-paths", 20)
    })
  });
}
function numberOption(args, name2, fallback) {
  const value = args.options.get(name2);
  if (value === void 0) {
    return fallback;
  }
  if (typeof value !== "string" || !Number.isInteger(Number(value)) || Number(value) < 0) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `${name2} must be a non-negative integer`, 2, { option: name2, value });
  }
  return Number(value);
}

// src/cli/commands/deleteSafeCommand.ts
var import_promises5 = require("node:fs/promises");
var import_node_path4 = require("node:path");

// src/write/deleteSafe.ts
var UNSAFE_DELETE_TYPES = /* @__PURE__ */ new Set([
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:BoundaryEvent",
  "bpmn:ExclusiveGateway",
  "bpmn:ParallelGateway",
  "bpmn:InclusiveGateway",
  "bpmn:EventBasedGateway",
  "bpmn:SubProcess",
  "bpmn:AdHocSubProcess",
  "bpmn:Transaction",
  "bpmn:CallActivity",
  "bpmn:SequenceFlow"
]);
function deleteSafeXml(args) {
  const deleted = args.indexes.byId.get(args.elementId);
  if (!deleted) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.elementId });
  }
  if (UNSAFE_DELETE_TYPES.has(deleted.type)) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Element type is not safe to delete in P3-C", 1, {
      elementId: args.elementId,
      type: deleted.type
    });
  }
  const incoming = args.indexes.incomingByNodeId.get(args.elementId) ?? [];
  const outgoing = args.indexes.outgoingByNodeId.get(args.elementId) ?? [];
  if (incoming.length !== 1 || outgoing.length !== 1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "delete-safe requires exactly one incoming and one outgoing sequence flow", 1, {
      elementId: args.elementId,
      incoming: incoming.length,
      outgoing: outgoing.length
    });
  }
  const incomingFlow = incoming[0];
  const outgoingFlow = outgoing[0];
  const replacementFlowId = args.replacementFlowId ?? `${incomingFlow.id}_to_${outgoingFlow.targetId}`;
  if (args.indexes.byId.has(replacementFlowId) || args.indexes.sequenceFlowById.has(replacementFlowId)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "Duplicate replacement flow id", 2, { replacementFlowId });
  }
  const replacementFlow = {
    id: replacementFlowId,
    type: "bpmn:SequenceFlow",
    name: null,
    sourceId: incomingFlow.sourceId,
    sourceName: incomingFlow.sourceName,
    targetId: outgoingFlow.targetId,
    targetName: outgoingFlow.targetName,
    condition: null
  };
  let xml2 = args.xml;
  xml2 = replaceNodeReference(xml2, incomingFlow.sourceId, "outgoing", incomingFlow.id, replacementFlow.id);
  xml2 = replaceNodeReference(xml2, outgoingFlow.targetId, "incoming", outgoingFlow.id, replacementFlow.id);
  xml2 = replaceSequenceFlowWithReplacement(xml2, incomingFlow.id, replacementFlow);
  xml2 = removeElementSection(xml2, outgoingFlow.id);
  xml2 = removeElementSection(xml2, deleted.id);
  xml2 = removeBpmndiByBpmnElement(xml2, [deleted.id, incomingFlow.id, outgoingFlow.id]);
  return {
    xml: xml2,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      deleted,
      removedFlows: [incomingFlow, outgoingFlow],
      replacementFlow,
      warnings: [{
        severity: "warning",
        code: "DI_NOT_UPDATED",
        message: "BPMNDI layout is not updated in P3-C"
      }],
      diff: [
        {
          op: "remove",
          path: `/elements/${deleted.id}`,
          before: deleted.name ?? deleted.id,
          after: null
        },
        {
          op: "remove",
          path: `/sequenceFlows/${incomingFlow.id}`,
          before: `${incomingFlow.sourceId}->${incomingFlow.targetId}`,
          after: null
        },
        {
          op: "remove",
          path: `/sequenceFlows/${outgoingFlow.id}`,
          before: `${outgoingFlow.sourceId}->${outgoingFlow.targetId}`,
          after: null
        },
        {
          op: "add",
          path: `/sequenceFlows/${replacementFlow.id}`,
          before: null,
          after: `${replacementFlow.sourceId}->${replacementFlow.targetId}`
        },
        {
          op: "replace",
          path: `/elements/${replacementFlow.sourceId}/outgoing`,
          before: incomingFlow.id,
          after: replacementFlow.id
        },
        {
          op: "replace",
          path: `/elements/${replacementFlow.targetId}/incoming`,
          before: outgoingFlow.id,
          after: replacementFlow.id
        }
      ]
    }
  };
}
function replaceNodeReference(xml2, elementId, direction, oldFlowId, newFlowId) {
  const section = findElementSection3(xml2, elementId);
  const body = xml2.slice(section.bodyStart, section.closeIndex);
  const oldReference = `<bpmn:${direction}>${oldFlowId}</bpmn:${direction}>`;
  if (!body.includes(oldReference)) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", `Could not find ${direction} reference on flow node`, 1, {
      elementId,
      flowId: oldFlowId
    });
  }
  const updatedBody = body.replace(oldReference, `<bpmn:${direction}>${newFlowId}</bpmn:${direction}>`);
  return `${xml2.slice(0, section.bodyStart)}${updatedBody}${xml2.slice(section.closeIndex)}`;
}
function replaceSequenceFlowWithReplacement(xml2, flowId, replacementFlow) {
  const section = findElementSection3(xml2, flowId);
  const lineStart = xml2.lastIndexOf("\n", section.openIndex) + 1;
  const indent = xml2.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? "";
  const replacement = `${indent}<bpmn:sequenceFlow id="${escapeAttribute3(replacementFlow.id)}" sourceRef="${escapeAttribute3(replacementFlow.sourceId)}" targetRef="${escapeAttribute3(replacementFlow.targetId)}" />`;
  return `${xml2.slice(0, lineStart)}${replacement}${xml2.slice(section.endIndex)}`;
}
function removeElementSection(xml2, elementId) {
  const section = findElementSection3(xml2, elementId);
  const lineStart = xml2.lastIndexOf("\n", section.openIndex) + 1;
  const lineEnd = xml2[section.endIndex] === "\n" ? section.endIndex + 1 : section.endIndex;
  return `${xml2.slice(0, lineStart)}${xml2.slice(lineEnd)}`;
}
function removeBpmndiByBpmnElement(xml2, ids) {
  let next = xml2;
  for (const id of ids) {
    next = removeSelfClosingTagsByAttribute(next, "bpmndi:BPMNShape", "bpmnElement", id);
    next = removeSelfClosingTagsByAttribute(next, "bpmndi:BPMNEdge", "bpmnElement", id);
    next = removePairedTagsByAttribute(next, "bpmndi:BPMNShape", "bpmnElement", id);
    next = removePairedTagsByAttribute(next, "bpmndi:BPMNEdge", "bpmnElement", id);
  }
  return next;
}
function removeSelfClosingTagsByAttribute(xml2, tagName, attribute, value) {
  const pattern = new RegExp(`^[ \\t]*<${escapeRegExp3(tagName)}\\b[^>]*\\b${escapeRegExp3(attribute)}="${escapeRegExp3(value)}"[^>]*/>\\n?`, "gm");
  return xml2.replace(pattern, "");
}
function removePairedTagsByAttribute(xml2, tagName, attribute, value) {
  const pattern = new RegExp(`^[ \\t]*<${escapeRegExp3(tagName)}\\b[^>]*\\b${escapeRegExp3(attribute)}="${escapeRegExp3(value)}"[^>]*>[\\s\\S]*?</${escapeRegExp3(tagName)}>\\n?`, "gm");
  return xml2.replace(pattern, "");
}
function findElementSection3(xml2, elementId) {
  const escapedId = escapeRegExp3(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml2.match(openPattern);
  if (!open || open.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target XML element", 1, { elementId });
  }
  if (open[0].endsWith("/>")) {
    return {
      openIndex: open.index,
      bodyStart: open.index + open[0].length,
      closeIndex: open.index + open[0].length,
      endIndex: open.index + open[0].length
    };
  }
  const closeTag = `</${open[1]}>`;
  const closeIndex = xml2.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target XML closing tag", 1, { elementId });
  }
  return {
    openIndex: open.index,
    bodyStart: open.index + open[0].length,
    closeIndex,
    endIndex: closeIndex + closeTag.length
  };
}
function escapeAttribute3(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp3(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/deleteSafeCommand.ts
async function deleteSafeCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "delete-safe requires a BPMN file", 2);
  }
  const elementId = args.options.get("--id");
  if (typeof elementId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "delete-safe requires --id", 2);
  }
  const replacementFlowId = args.options.get("--replacement-flow-id");
  if (replacementFlowId !== void 0 && typeof replacementFlowId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--replacement-flow-id requires a value", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = deleteSafeXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    elementId,
    replacementFlowId: replacementFlowId ?? null,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml3(plan.xml);
  if (write) {
    await writeOutput3(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "delete-safe",
    file: args.file,
    result: plan.result
  });
}
async function validateXml3(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput3(path, payload) {
  try {
    await (0, import_promises5.mkdir)((0, import_node_path4.dirname)(path), { recursive: true });
    await (0, import_promises5.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write delete-safe BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/cli/commands/documentationCommand.ts
var import_promises6 = require("node:fs/promises");
var import_node_path5 = require("node:path");

// src/write/documentElement.ts
function documentElementXml(args) {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.elementId });
  }
  const patch = patchDocumentation(args.xml, args.elementId, args.text);
  return {
    xml: patch.xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      before: { documentation: patch.before },
      after: { documentation: args.text },
      diff: [{
        op: patch.operation,
        path: `/elements/${args.elementId}/documentation`,
        before: patch.before,
        after: args.text
      }]
    }
  };
}
function patchDocumentation(xml2, elementId, text) {
  const escapedId = escapeRegExp4(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml2.match(openPattern);
  if (!open || open.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target element opening tag", 1, { elementId });
  }
  const fullOpenTag = open[0];
  const tagName = open[1];
  const start = open.index;
  const escapedText = escapeText3(text);
  if (fullOpenTag.endsWith("/>")) {
    const replacement = `${fullOpenTag.slice(0, -2)}><bpmn:documentation>${escapedText}</bpmn:documentation></${tagName}>`;
    return {
      xml: `${xml2.slice(0, start)}${replacement}${xml2.slice(start + fullOpenTag.length)}`,
      operation: "add",
      before: null
    };
  }
  const closeTag = `</${tagName}>`;
  const closeIndex = xml2.indexOf(closeTag, start + fullOpenTag.length);
  if (closeIndex === -1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target element closing tag", 1, { elementId });
  }
  const bodyStart = start + fullOpenTag.length;
  const body = xml2.slice(bodyStart, closeIndex);
  const docPattern = /<bpmn:documentation\b[^>]*>([\s\S]*?)<\/bpmn:documentation>/;
  const doc = body.match(docPattern);
  if (doc && doc.index !== void 0) {
    const before = unescapeText(doc[1]);
    const replacement = `<bpmn:documentation>${escapedText}</bpmn:documentation>`;
    const absoluteDocStart = bodyStart + doc.index;
    return {
      xml: `${xml2.slice(0, absoluteDocStart)}${replacement}${xml2.slice(absoluteDocStart + doc[0].length)}`,
      operation: "replace",
      before
    };
  }
  const insertion = `<bpmn:documentation>${escapedText}</bpmn:documentation>`;
  return {
    xml: `${xml2.slice(0, bodyStart)}${insertion}${xml2.slice(bodyStart)}`,
    operation: "add",
    before: null
  };
}
function escapeText3(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unescapeText(value) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function escapeRegExp4(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/documentationCommand.ts
async function documentationCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "documentation requires a BPMN file", 2);
  }
  const elementId = args.options.get("--id");
  if (typeof elementId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "documentation requires --id", 2);
  }
  const text = args.options.get("--text");
  if (typeof text !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "documentation requires --text", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = documentElementXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    elementId,
    text,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml4(plan.xml);
  if (write) {
    await writeOutput4(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "documentation",
    file: args.file,
    result: plan.result
  });
}
async function validateXml4(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput4(path, payload) {
  try {
    await (0, import_promises6.mkdir)((0, import_node_path5.dirname)(path), { recursive: true });
    await (0, import_promises6.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write documented BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/query/element.ts
function getElement(indexes, args) {
  const element = indexes.byId.get(args.id);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.id }, suggestions2(indexes, args.id));
  }
  const sequenceFlow = indexes.sequenceFlowById.get(args.id);
  if (sequenceFlow) {
    return {
      element: {
        ...element,
        source: indexes.byId.get(sequenceFlow.sourceId) ?? null,
        target: indexes.byId.get(sequenceFlow.targetId) ?? null,
        condition: sequenceFlow.condition,
        details: getElementDetails(indexes, element)
      }
    };
  }
  return {
    element: {
      ...element,
      incoming: indexes.incomingByNodeId.get(element.id) ?? [],
      outgoing: indexes.outgoingByNodeId.get(element.id) ?? [],
      implementations: indexes.implementationsByElementId.get(element.id) ?? [],
      boundaryEvents: indexes.boundaryEventsByAttachedToId.get(element.id) ?? [],
      laneIds: (indexes.lanesByElementId.get(element.id) ?? []).map((lane) => lane.id),
      participantId: element.processId ? indexes.participantByProcessId.get(element.processId)?.id ?? null : null,
      details: getElementDetails(indexes, element)
    }
  };
}
function suggestions2(indexes, query) {
  const normalized = query.toLocaleLowerCase();
  return [...indexes.byId.values()].map((element) => ({
    ...element,
    score: element.id.toLocaleLowerCase().includes(normalized) ? 0.7 : (element.name ?? "").toLocaleLowerCase().includes(normalized) ? 0.5 : 0
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 5);
}

// src/cli/commands/elementCommand.ts
async function elementCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "element requires a BPMN file", 2);
  }
  const id = args.options.get("--id");
  if (typeof id !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "element requires --id", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "element",
    file: args.file,
    result: getElement(buildIndexes(model), { id })
  });
}

// src/cli/commands/exportCommand.ts
var import_promises7 = require("node:fs/promises");
var import_node_path6 = require("node:path");

// src/export/renderMarkdown.ts
function renderMarkdown(model) {
  const lines = ["# BPMN Export", ""];
  if (model.overview) {
    lines.push("## Overview", "", `- Definitions: ${model.overview.definitions.id ?? "(none)"}`);
    for (const process2 of model.overview.processes) {
      lines.push(`- Process ${process2.id}: ${process2.name ?? "(unnamed)"}; nodes ${process2.flowNodes}; flows ${process2.sequenceFlows}`);
    }
    lines.push("");
  }
  if (model.participants) {
    lines.push("## Participants", "");
    for (const collaboration of model.participants.collaborations) {
      lines.push(`- Collaboration ${collaboration.id}: ${collaboration.name ?? "(unnamed)"}`);
      for (const participant of collaboration.participants) {
        lines.push(`  - Participant ${participant.id}: ${participant.name ?? "(unnamed)"} -> ${participant.processId ?? "(no process)"}`);
      }
      for (const flow of collaboration.messageFlows) {
        lines.push(`  - MessageFlow ${flow.id}: ${flow.sourceId ?? "?"} -> ${flow.targetId ?? "?"}`);
      }
    }
    lines.push("");
  }
  if (model.lanes) {
    lines.push("## Lanes", "");
    for (const lane of model.lanes.lanes) {
      lines.push(`- Lane ${lane.id}: ${lane.name ?? "(unnamed)"}; nodes ${lane.flowNodes.map((node) => node.id).join(", ") || "(empty)"}`);
    }
    lines.push("");
  }
  if (model.events) {
    lines.push("## Events", "");
    for (const event of model.events.events) {
      const definitions = event.eventDefinitions.map((definition) => definition.value ?? definition.refId ?? definition.type).join(", ");
      lines.push(`- Event ${event.id}: ${event.category}; ${definitions || "no definition"}`);
    }
    lines.push("");
  }
  if (model.subprocess) {
    lines.push("## Subprocesses", "");
    for (const subprocess of model.subprocess.subprocesses) {
      lines.push(`- Subprocess ${subprocess.element.id}: children ${subprocess.children.map((child) => child.id).join(", ") || "(none)"}`);
    }
    lines.push("");
  }
  if (model.implementations) {
    lines.push("## Implementations", "");
    const implementations = [
      ...model.implementations.serviceTasks,
      ...model.implementations.callActivities,
      ...model.implementations.listeners,
      ...model.implementations.forms
    ];
    for (const implementation of implementations) {
      lines.push(`- ${implementation.elementId}: ${implementation.kind}${implementation.value ? ` ${implementation.value}` : ""}${implementation.topic ? ` topic=${implementation.topic}` : ""}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}
`;
}

// src/export/renderText.ts
function renderText(model) {
  const lines = ["BPMN Export", ""];
  if (model.overview) {
    lines.push("OVERVIEW", `Definitions: ${model.overview.definitions.id ?? "(none)"}`);
    for (const process2 of model.overview.processes) {
      lines.push(`Process ${process2.id}: ${process2.name ?? "(unnamed)"}; nodes ${process2.flowNodes}; flows ${process2.sequenceFlows}`);
    }
    lines.push("");
  }
  if (model.participants) {
    lines.push("PARTICIPANTS");
    for (const collaboration of model.participants.collaborations) {
      lines.push(`Collaboration ${collaboration.id}: ${collaboration.name ?? "(unnamed)"}`);
      for (const participant of collaboration.participants) {
        lines.push(`Participant ${participant.id}: ${participant.name ?? "(unnamed)"} -> ${participant.processId ?? "(no process)"}`);
      }
    }
    lines.push("");
  }
  if (model.lanes) {
    lines.push("LANES");
    for (const lane of model.lanes.lanes) {
      lines.push(`Lane ${lane.id}: ${lane.flowNodes.map((node) => node.id).join(", ") || "(empty)"}`);
    }
    lines.push("");
  }
  if (model.events) {
    lines.push("EVENTS");
    for (const event of model.events.events) {
      lines.push(`Event ${event.id}: ${event.category}`);
    }
    lines.push("");
  }
  if (model.subprocess) {
    lines.push("SUBPROCESSES");
    for (const subprocess of model.subprocess.subprocesses) {
      lines.push(`Subprocess ${subprocess.element.id}: children ${subprocess.children.map((child) => child.id).join(", ") || "(none)"}`);
    }
    lines.push("");
  }
  if (model.implementations) {
    lines.push("IMPLEMENTATIONS");
    for (const implementation of [
      ...model.implementations.serviceTasks,
      ...model.implementations.callActivities,
      ...model.implementations.listeners,
      ...model.implementations.forms
    ]) {
      lines.push(`${implementation.elementId}: ${implementation.kind}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}
`;
}

// src/query/events.ts
var EVENT_TYPES = /* @__PURE__ */ new Set([
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:BoundaryEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent"
]);
var VALID_FILTERS = /* @__PURE__ */ new Set(["start", "end", "boundary", "intermediate", "other"]);
function getEvents(model, indexes, args) {
  if (args.type && !VALID_FILTERS.has(args.type)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "Invalid events --type value", 2, {
      option: "--type",
      value: args.type
    });
  }
  const filter2 = args.type;
  const events = collectFlowElements(model.processes).filter((element) => typeof element.id === "string" && EVENT_TYPES.has(String(element.$type))).map((element) => summarizeEvent(element, indexes)).filter((event) => !filter2 || event.category === filter2).sort(sortById);
  return { events };
}
function summarizeEvent(element, indexes) {
  const id = String(element.id);
  const type = String(element.$type);
  const attachedToId = idOf3(element.attachedToRef);
  return {
    id,
    type,
    name: stringValue(element.name),
    processId: indexes.byId.get(id)?.processId ?? null,
    eventDefinitionType: arrayOf2(element.eventDefinitions)[0]?.$type ?? null,
    category: categoryFor(type),
    eventDefinitions: arrayOf2(element.eventDefinitions).map(summarizeEventDefinition),
    attachedTo: attachedToId ? indexes.byId.get(attachedToId) ?? null : null,
    outgoing: indexes.outgoingByNodeId.get(id) ?? [],
    incoming: indexes.incomingByNodeId.get(id) ?? []
  };
}
function collectFlowElements(processes) {
  const result = [];
  for (const process2 of processes) {
    visitFlowElements(arrayOf2(process2.flowElements), result);
  }
  return result;
}
function visitFlowElements(elements, result) {
  for (const element of elements) {
    result.push(element);
    visitFlowElements(arrayOf2(element.flowElements), result);
  }
}
function categoryFor(type) {
  if (type === "bpmn:StartEvent") {
    return "start";
  }
  if (type === "bpmn:EndEvent") {
    return "end";
  }
  if (type === "bpmn:BoundaryEvent") {
    return "boundary";
  }
  if (type === "bpmn:IntermediateCatchEvent" || type === "bpmn:IntermediateThrowEvent") {
    return "intermediate";
  }
  return "other";
}
function summarizeEventDefinition(definition) {
  const value = timerValue2(definition);
  const ref = refValue(definition);
  return {
    type: String(definition.$type),
    ...value ? { value } : {},
    ...ref.id ? { refId: ref.id } : {},
    ...ref.name ? { refName: ref.name } : {}
  };
}
function timerValue2(definition) {
  for (const key of ["timeDuration", "timeDate", "timeCycle"]) {
    const candidate = definition[key];
    if (isRecord3(candidate)) {
      const value = stringValue(candidate.body);
      if (value) {
        return value;
      }
    }
  }
  return null;
}
function refValue(definition) {
  for (const key of ["messageRef", "errorRef", "signalRef", "escalationRef"]) {
    const candidate = definition[key];
    const id = idOf3(candidate);
    if (id) {
      return { id, name: isRecord3(candidate) ? stringValue(candidate.name) : null };
    }
  }
  return { id: null, name: null };
}
function idOf3(value) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (isRecord3(value) && typeof value.id === "string") {
    return value.id;
  }
  return null;
}
function isRecord3(value) {
  return typeof value === "object" && value !== null;
}
function sortById(a, b) {
  return a.id.localeCompare(b.id);
}

// src/query/implementations.ts
function listImplementations(indexes, args) {
  const all = [...indexes.implementationsByElementId.values()].flat();
  const filtered = args.type ? all.filter((implementation) => implementation.kind === args.type) : all;
  return {
    serviceTasks: filtered.filter((implementation) => implementation.elementType === "bpmn:ServiceTask" && !["listener", "form"].includes(implementation.kind)),
    callActivities: filtered.filter((implementation) => implementation.kind === "callActivity"),
    listeners: filtered.filter((implementation) => implementation.kind === "listener"),
    forms: filtered.filter((implementation) => implementation.kind === "form")
  };
}

// src/query/lanes.ts
function getLanes(indexes, args) {
  if (args.elementId) {
    const element = indexes.byId.get(args.elementId);
    if (!element) {
      throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.elementId });
    }
    const lanes = [...indexes.lanesByElementId.get(args.elementId) ?? []].sort(sortById2);
    return {
      lanes: lanes.map((lane) => expandLane(indexes, lane)),
      elementLanes: [{ element, lanes }]
    };
  }
  return {
    lanes: [...indexes.lanesById.values()].sort(sortById2).map((lane) => expandLane(indexes, lane)),
    elementLanes: []
  };
}
function expandLane(indexes, lane) {
  return {
    id: lane.id,
    name: lane.name,
    processId: lane.processId,
    flowNodes: lane.flowNodeIds.map((id) => indexes.byId.get(id)).filter((element) => Boolean(element)).sort(sortById2)
  };
}
function sortById2(a, b) {
  return a.id.localeCompare(b.id);
}

// src/validate/validateModel.ts
function validateModel(model, indexes) {
  const errors = [];
  const warnings = [];
  for (const process2 of model.processes) {
    for (const element of arrayOf2(process2.flowElements)) {
      if (element.$type !== "bpmn:SequenceFlow" || !element.id) {
        continue;
      }
      if (!element.sourceRef) {
        errors.push({
          severity: "error",
          code: "BROKEN_SEQUENCE_FLOW_SOURCE",
          message: "Sequence flow source does not exist",
          elementId: element.id
        });
      }
      if (!element.targetRef) {
        errors.push({
          severity: "error",
          code: "BROKEN_SEQUENCE_FLOW_TARGET",
          message: "Sequence flow target does not exist",
          elementId: element.id
        });
      }
    }
  }
  for (const flow of indexes.sequenceFlowById.values()) {
    if (!indexes.byId.has(flow.sourceId)) {
      errors.push({
        severity: "error",
        code: "BROKEN_SEQUENCE_FLOW_SOURCE",
        message: "Sequence flow source does not exist",
        elementId: flow.id,
        details: { sourceRef: flow.sourceId }
      });
    }
    if (!indexes.byId.has(flow.targetId)) {
      errors.push({
        severity: "error",
        code: "BROKEN_SEQUENCE_FLOW_TARGET",
        message: "Sequence flow target does not exist",
        elementId: flow.id,
        details: { targetRef: flow.targetId }
      });
    }
  }
  for (const element of indexes.byId.values()) {
    if (element.type.endsWith("Task")) {
      const incoming = indexes.incomingByNodeId.get(element.id)?.length ?? 0;
      const outgoing = indexes.outgoingByNodeId.get(element.id)?.length ?? 0;
      if (incoming === 0 || outgoing === 0) {
        warnings.push({
          severity: "warning",
          code: "TASK_WITHOUT_COMPLETE_FLOW",
          message: "Task has no incoming or outgoing sequence flow",
          elementId: element.id,
          details: { incoming, outgoing }
        });
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos: []
  };
}

// src/query/overview.ts
var TASK_TYPES = /* @__PURE__ */ new Set([
  "bpmn:Task",
  "bpmn:UserTask",
  "bpmn:ServiceTask",
  "bpmn:ScriptTask",
  "bpmn:BusinessRuleTask",
  "bpmn:SendTask",
  "bpmn:ReceiveTask",
  "bpmn:ManualTask"
]);
var GATEWAY_TYPES = /* @__PURE__ */ new Set([
  "bpmn:ExclusiveGateway",
  "bpmn:ParallelGateway",
  "bpmn:InclusiveGateway",
  "bpmn:EventBasedGateway"
]);
var EVENT_TYPES2 = /* @__PURE__ */ new Set([
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:BoundaryEvent"
]);
function getOverview(model, indexes) {
  const diagnostics = validateModel(model, indexes);
  return {
    definitions: { id: stringOrNull(model.definitions.id) },
    processes: model.processes.map((process2) => summarizeProcess(process2)).sort((a, b) => a.id.localeCompare(b.id)),
    collaborations: model.collaborations.map((collaboration) => ({
      id: String(collaboration.id),
      name: stringOrNull(collaboration.name),
      participants: arrayOf3(collaboration.participants).length,
      messageFlows: arrayOf3(collaboration.messageFlows).length
    })).sort((a, b) => a.id.localeCompare(b.id)),
    counts: {
      tasks: countTypes(indexes, TASK_TYPES),
      gateways: countTypes(indexes, GATEWAY_TYPES),
      events: countTypes(indexes, EVENT_TYPES2),
      sequenceFlows: indexes.sequenceFlowById.size,
      messageFlows: indexes.messageFlowById.size
    },
    extensions: detectExtensions(model),
    diagnosticsSummary: {
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      infos: diagnostics.infos.length
    },
    warnings: diagnostics.warnings
  };
}
function summarizeProcess(process2) {
  const flowElements = arrayOf3(process2.flowElements);
  return {
    id: String(process2.id),
    name: stringOrNull(process2.name),
    flowNodes: flowElements.filter((element) => element.$type !== "bpmn:SequenceFlow").length,
    sequenceFlows: flowElements.filter((element) => element.$type === "bpmn:SequenceFlow").length
  };
}
function countTypes(indexes, types2) {
  return Object.fromEntries([...types2].map((type) => [type, indexes.byType.get(type)?.length ?? 0]).filter(([, count]) => count > 0).sort(([a], [b]) => a.localeCompare(b)));
}
function detectExtensions(model) {
  const serialized = model.xml;
  return [
    serialized.includes("camunda.org/schema") ? "camunda" : null
  ].filter((item) => item !== null);
}
function stringOrNull(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}
function arrayOf3(value) {
  return Array.isArray(value) ? value : [];
}

// src/query/participants.ts
function getParticipants(model, indexes) {
  const referencedProcessIds = /* @__PURE__ */ new Set();
  const collaborations = model.collaborations.map((collaboration) => {
    const participants = arrayOf2(collaboration.participants).map((participant) => ({
      id: String(participant.id),
      name: stringValue(participant.name),
      processId: idOf4(participant.processRef)
    })).sort(sortById3);
    for (const participant of participants) {
      if (participant.processId) {
        referencedProcessIds.add(participant.processId);
      }
    }
    return {
      id: String(collaboration.id),
      name: stringValue(collaboration.name),
      participants,
      messageFlows: arrayOf2(collaboration.messageFlows).map((flow) => indexes.messageFlowById.get(String(flow.id))).filter((flow) => Boolean(flow)).sort(sortById3)
    };
  }).sort(sortById3);
  return {
    collaborations,
    unreferencedProcesses: model.processes.map((process2) => ({ id: String(process2.id), name: stringValue(process2.name) })).filter((process2) => !referencedProcessIds.has(process2.id)).sort(sortById3)
  };
}
function idOf4(value) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }
  if (typeof value === "object" && value !== null && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}
function sortById3(a, b) {
  return a.id.localeCompare(b.id);
}

// src/query/subprocess.ts
var SUBPROCESS_TYPES2 = /* @__PURE__ */ new Set(["bpmn:SubProcess", "bpmn:AdHocSubProcess", "bpmn:Transaction"]);
function getSubprocesses(indexes, args) {
  if (args.id) {
    const element = indexes.byId.get(args.id);
    if (!element) {
      throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.id });
    }
    if (!SUBPROCESS_TYPES2.has(element.type)) {
      throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Element is not a subprocess", 1, {
        elementId: args.id,
        type: element.type
      });
    }
    return { subprocesses: [summarizeSubprocess(indexes, element)] };
  }
  return {
    subprocesses: [...indexes.byId.values()].filter((element) => SUBPROCESS_TYPES2.has(element.type)).sort(sortById4).map((element) => summarizeSubprocess(indexes, element))
  };
}
function summarizeSubprocess(indexes, element) {
  const children = [...indexes.childrenBySubprocessId.get(element.id) ?? []].sort(sortById4);
  return {
    element,
    parentSubprocessId: indexes.subprocessParentByChildId.get(element.id) ?? null,
    children,
    nestedSubprocesses: children.filter((child) => SUBPROCESS_TYPES2.has(child.type)).sort(sortById4),
    incoming: indexes.incomingByNodeId.get(element.id) ?? [],
    outgoing: indexes.outgoingByNodeId.get(element.id) ?? [],
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(element.id) ?? []
  };
}
function sortById4(a, b) {
  return a.id.localeCompare(b.id);
}

// src/query/exportModel.ts
var EXPORT_SECTIONS = ["overview", "participants", "lanes", "events", "subprocess", "implementations"];
function buildExportModel(model, sections) {
  const indexes = buildIndexes(model);
  const result = {
    format: "json",
    sections: [...sections]
  };
  for (const section of sections) {
    if (section === "overview") {
      result.overview = getOverview(model, indexes);
    } else if (section === "participants") {
      result.participants = getParticipants(model, indexes);
    } else if (section === "lanes") {
      result.lanes = getLanes(indexes, {});
    } else if (section === "events") {
      result.events = getEvents(model, indexes, {});
    } else if (section === "subprocess") {
      result.subprocess = getSubprocesses(indexes, {});
    } else if (section === "implementations") {
      result.implementations = listImplementations(indexes, {});
    }
  }
  return result;
}

// src/cli/commands/exportCommand.ts
var FORMATS = /* @__PURE__ */ new Set(["markdown", "text", "json"]);
async function exportCommand(args, pretty) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "export requires a BPMN file", 2);
  }
  const format = parseFormat(args.options.get("--format"));
  const sections = parseSections(args.options.get("--section"));
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  const model = await loadBpmn(args.file);
  const exportModel = buildExportModel(model, sections);
  const payload = format === "json" ? JSON.stringify(successEnvelope({ command: "export", file: args.file, result: exportModel }), null, pretty ? 2 : 0) : render(format, exportModel);
  if (outputPath) {
    await writeOutput5(outputPath, payload);
    return;
  }
  if (format === "json") {
    writeJson(successEnvelope({ command: "export", file: args.file, result: exportModel }), pretty);
    return;
  }
  process.stdout.write(payload);
}
function parseFormat(value) {
  if (value === void 0) {
    return "markdown";
  }
  if (typeof value !== "string" || !FORMATS.has(value)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--format must be markdown, text, or json", 2, { option: "--format", value });
  }
  return value;
}
function parseSections(value) {
  if (value === void 0 || value === "all") {
    return [...EXPORT_SECTIONS];
  }
  if (typeof value !== "string" || !EXPORT_SECTIONS.includes(value)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--section must be all or a supported export section", 2, { option: "--section", value });
  }
  return [value];
}
function render(format, model) {
  return format === "markdown" ? renderMarkdown(model) : renderText(model);
}
async function writeOutput5(path, payload) {
  try {
    await (0, import_promises7.mkdir)((0, import_node_path6.dirname)(path), { recursive: true });
    await (0, import_promises7.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write export output", 1, { path, cause: error3 instanceof Error ? error3.message : String(error3) });
  }
}

// src/cli/commands/eventsCommand.ts
async function eventsCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "events requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "events",
    file: args.file,
    result: getEvents(model, buildIndexes(model), {
      type: stringOption(args.options.get("--type"))
    })
  });
}
function stringOption(value) {
  return typeof value === "string" ? value : void 0;
}

// src/index/typeAliases.ts
var TYPE_ALIASES = /* @__PURE__ */ new Map([
  ["task", ["bpmn:Task", "bpmn:UserTask", "bpmn:ServiceTask", "bpmn:ScriptTask", "bpmn:BusinessRuleTask", "bpmn:SendTask", "bpmn:ReceiveTask", "bpmn:ManualTask"]],
  ["userTask", ["bpmn:UserTask"]],
  ["serviceTask", ["bpmn:ServiceTask"]],
  ["gateway", ["bpmn:ExclusiveGateway", "bpmn:ParallelGateway", "bpmn:InclusiveGateway", "bpmn:EventBasedGateway"]],
  ["exclusiveGateway", ["bpmn:ExclusiveGateway"]],
  ["event", ["bpmn:StartEvent", "bpmn:EndEvent", "bpmn:IntermediateCatchEvent", "bpmn:IntermediateThrowEvent", "bpmn:BoundaryEvent"]],
  ["startEvent", ["bpmn:StartEvent"]],
  ["endEvent", ["bpmn:EndEvent"]],
  ["boundaryEvent", ["bpmn:BoundaryEvent"]],
  ["sequenceFlow", ["bpmn:SequenceFlow"]],
  ["subprocess", ["bpmn:SubProcess"]],
  ["callActivity", ["bpmn:CallActivity"]]
]);

// src/query/findElements.ts
function findElements(indexes, args) {
  const limit = Math.max(0, args.limit);
  const typeFilter = resolveTypeFilter(args.type);
  const query = args.id ?? args.name ?? args.query ?? null;
  const normalizedQuery = normalizeName(query);
  const candidates = [...indexes.byId.values()];
  const scored = /* @__PURE__ */ new Map();
  for (const candidate of candidates) {
    if (args.processId && candidate.processId !== args.processId) {
      continue;
    }
    if (typeFilter && !typeFilter.has(candidate.type)) {
      continue;
    }
    const score = scoreCandidate(candidate, {
      id: args.id,
      name: args.name,
      query: args.query,
      normalizedQuery,
      typeOnly: Boolean(typeFilter && !query)
    });
    if (score === 0) {
      continue;
    }
    scored.set(candidate.id, {
      ...candidate,
      incoming: indexes.incomingByNodeId.get(candidate.id)?.length ?? 0,
      outgoing: indexes.outgoingByNodeId.get(candidate.id)?.length ?? 0,
      score
    });
  }
  const matches = [...scored.values()].sort(compareMatches);
  return {
    query,
    matches: matches.slice(0, limit),
    truncated: matches.length > limit
  };
}
function resolveTypeFilter(type) {
  if (!type) {
    return null;
  }
  if (type.startsWith("bpmn:")) {
    return /* @__PURE__ */ new Set([type]);
  }
  const resolved = TYPE_ALIASES.get(type);
  if (!resolved) {
    throw new BpmnCliError("INVALID_TYPE_FILTER", "Invalid type filter", 2, { type });
  }
  return new Set(resolved);
}
function scoreCandidate(candidate, args) {
  if (args.id) {
    return candidate.id === args.id ? 1 : 0;
  }
  const normalizedName = normalizeName(candidate.name);
  const query = args.name ?? args.query;
  if (!query && args.typeOnly) {
    return 0.5;
  }
  if (!query) {
    return 0;
  }
  const scores = [];
  if (candidate.id === query) {
    scores.push(1);
  }
  if (normalizedName && normalizedName === args.normalizedQuery) {
    scores.push(0.95);
  }
  if (normalizedName && normalizedName.includes(args.normalizedQuery)) {
    scores.push(0.8);
  }
  if (candidate.id.includes(query)) {
    scores.push(0.7);
  }
  return Math.max(0, ...scores);
}
function compareMatches(a, b) {
  return b.score - a.score || a.id.localeCompare(b.id) || a.type.localeCompare(b.type) || (a.name ?? "").localeCompare(b.name ?? "");
}

// src/cli/commands/findCommand.ts
async function findCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "find requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  return successEnvelope({
    command: "find",
    file: args.file,
    result: findElements(indexes, {
      query: stringOption2(args, "--query"),
      id: stringOption2(args, "--id"),
      name: stringOption2(args, "--name"),
      type: stringOption2(args, "--type"),
      processId: stringOption2(args, "--process"),
      limit: numberOption2(args, "--limit", 20)
    })
  });
}
function stringOption2(args, name2) {
  const value = args.options.get(name2);
  return typeof value === "string" ? value : void 0;
}
function numberOption2(args, name2, fallback) {
  const value = stringOption2(args, name2);
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `${name2} must be a non-negative integer`, 2, { option: name2, value });
  }
  return parsed;
}

// src/cli/commands/formatCommand.ts
var import_promises8 = require("node:fs/promises");
var import_node_path7 = require("node:path");

// src/write/formatBpmn.ts
async function formatBpmnModel(args) {
  const { xml: xml2 } = await createBpmnModdle().toXML(args.model.definitions, { format: true });
  const formatted = xml2.endsWith("\n") ? xml2 : `${xml2}
`;
  return {
    xml: formatted,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      changed: formatted !== args.model.xml,
      before: {
        bytes: Buffer.byteLength(args.model.xml, "utf8")
      },
      after: {
        bytes: Buffer.byteLength(formatted, "utf8")
      },
      diagnostics: {
        warnings: args.model.warnings
      }
    }
  };
}

// src/cli/commands/formatCommand.ts
async function formatCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "format requires a BPMN file", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = await formatBpmnModel({
    model,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml5(plan.xml);
  if (write) {
    await writeOutput6(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "format",
    file: args.file,
    result: plan.result
  });
}
async function validateXml5(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Formatted BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput6(path, payload) {
  try {
    await (0, import_promises8.mkdir)((0, import_node_path7.dirname)(path), { recursive: true });
    await (0, import_promises8.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write formatted BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/query/gateway.ts
var GATEWAY_BEHAVIOR = /* @__PURE__ */ new Map([
  ["bpmn:ExclusiveGateway", "exclusive"],
  ["bpmn:InclusiveGateway", "inclusive"],
  ["bpmn:ParallelGateway", "parallel"],
  ["bpmn:EventBasedGateway", "eventBased"]
]);
function explainGateway(indexes, args) {
  const gateway = indexes.byId.get(args.id);
  if (!gateway) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.id });
  }
  const behavior = GATEWAY_BEHAVIOR.get(gateway.type);
  if (!behavior) {
    throw new BpmnCliError("ELEMENT_IS_NOT_GATEWAY", "Element is not a gateway", 1, { elementId: args.id, type: gateway.type });
  }
  const outgoing = indexes.outgoingByNodeId.get(gateway.id) ?? [];
  return {
    id: gateway.id,
    type: gateway.type,
    name: gateway.name,
    incoming: indexes.incomingByNodeId.get(gateway.id) ?? [],
    branches: outgoing.map((flow) => ({
      flowId: flow.id,
      name: flow.name,
      condition: flow.condition,
      target: indexes.byId.get(flow.targetId) ?? {
        id: flow.targetId,
        type: "bpmn:Unknown",
        name: null,
        processId: gateway.processId
      }
    })),
    behavior,
    diagnostics: diagnosticsFor(behavior, outgoing)
  };
}
function diagnosticsFor(behavior, outgoing) {
  if ((behavior === "exclusive" || behavior === "inclusive") && outgoing.some((flow) => !flow.condition)) {
    return [{
      severity: "warning",
      code: "GATEWAY_BRANCH_WITHOUT_CONDITION",
      message: "Gateway has outgoing branch without condition"
    }];
  }
  return [];
}

// src/cli/commands/gatewayCommand.ts
async function gatewayCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "gateway requires a BPMN file", 2);
  }
  const id = args.options.get("--id");
  if (typeof id !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "gateway requires --id", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "gateway",
    file: args.file,
    result: explainGateway(buildIndexes(model), { id })
  });
}

// src/cli/commands/implementationCommand.ts
var import_promises9 = require("node:fs/promises");
var import_node_path8 = require("node:path");

// src/write/implementationElement.ts
var CAMUNDA_NS = "http://camunda.org/schema/1.0/bpmn";
function setImplementationXml(args) {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.elementId });
  }
  const kind = parseKind(args.kind);
  const patches = patchesFor(kind, args.value);
  const patched = patchOpeningTag(args.xml, args.elementId, patches);
  const xml2 = patches.some((patch) => patch.name.startsWith("camunda:")) ? ensureCamundaNamespace(patched.xml) : patched.xml;
  return {
    xml: xml2,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      kind,
      before: patched.before,
      after: Object.fromEntries(patches.map((patch) => [patch.name, patch.value])),
      diff: patched.diff.map((item) => ({
        ...item,
        path: `/elements/${args.elementId}/${item.path}`
      }))
    }
  };
}
function parseKind(kind) {
  if (kind === "delegateExpression" || kind === "class" || kind === "expression" || kind === "externalTask" || kind === "form" || kind === "callActivity") {
    return kind;
  }
  throw new BpmnCliError("INVALID_OPTION_VALUE", `Unsupported implementation kind: ${kind}`, 2, { kind });
}
function patchesFor(kind, value) {
  if (kind === "delegateExpression") {
    return [{ name: "camunda:delegateExpression", value }];
  }
  if (kind === "class") {
    return [{ name: "camunda:class", value }];
  }
  if (kind === "expression") {
    return [{ name: "camunda:expression", value }];
  }
  if (kind === "externalTask") {
    return [
      { name: "camunda:type", value: "external" },
      { name: "camunda:topic", value }
    ];
  }
  if (kind === "form") {
    return [{ name: "camunda:formKey", value }];
  }
  return [{ name: "calledElement", value }];
}
function patchOpeningTag(xml2, elementId, patches) {
  const escapedId = escapeRegExp5(elementId);
  const tagPattern = new RegExp(`<[^!?/][^>]*\\bid="${escapedId}"[^>]*>`);
  const match = xml2.match(tagPattern);
  if (!match || match.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target element opening tag", 1, { elementId });
  }
  let tag = match[0];
  const before = {};
  const diff = [];
  for (const patch of patches) {
    const existing = readAttribute(tag, patch.name);
    before[patch.name] = existing;
    tag = writeAttribute(tag, patch.name, patch.value);
    diff.push({
      op: existing === null ? "add" : "replace",
      path: patch.name,
      before: existing,
      after: patch.value
    });
  }
  return {
    xml: `${xml2.slice(0, match.index)}${tag}${xml2.slice(match.index + match[0].length)}`,
    before,
    diff
  };
}
function readAttribute(tag, name2) {
  const pattern = new RegExp(`\\s${escapeRegExp5(name2)}="([^"]*)"`);
  return tag.match(pattern)?.[1] ?? null;
}
function writeAttribute(tag, name2, value) {
  const escapedValue = escapeAttribute4(value);
  const pattern = new RegExp(`\\s${escapeRegExp5(name2)}="[^"]*"`);
  if (pattern.test(tag)) {
    return tag.replace(pattern, ` ${name2}="${escapedValue}"`);
  }
  return tag.replace(/\/?>$/, (suffix) => ` ${name2}="${escapedValue}"${suffix}`);
}
function ensureCamundaNamespace(xml2) {
  if (xml2.includes("xmlns:camunda=")) {
    return xml2;
  }
  const definitionsPattern = /<bpmn:definitions\b[^>]*>/;
  const match = xml2.match(definitionsPattern);
  if (!match || match.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find bpmn:definitions opening tag", 1);
  }
  const tag = match[0].replace(/>$/, ` xmlns:camunda="${CAMUNDA_NS}">`);
  return `${xml2.slice(0, match.index)}${tag}${xml2.slice(match.index + match[0].length)}`;
}
function escapeAttribute4(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp5(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/implementationCommand.ts
async function implementationCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "implementation requires a BPMN file", 2);
  }
  const elementId = args.options.get("--id");
  if (typeof elementId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "implementation requires --id", 2);
  }
  const kind = args.options.get("--kind");
  if (typeof kind !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "implementation requires --kind", 2);
  }
  const value = args.options.get("--value");
  if (typeof value !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "implementation requires --value", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = setImplementationXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    elementId,
    kind,
    value,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml6(plan.xml);
  if (write) {
    await writeOutput7(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "implementation",
    file: args.file,
    result: plan.result
  });
}
async function validateXml6(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput7(path, payload) {
  try {
    await (0, import_promises9.mkdir)((0, import_node_path8.dirname)(path), { recursive: true });
    await (0, import_promises9.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write implementation BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/cli/commands/implementationsCommand.ts
async function implementationsCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "implementations requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "implementations",
    file: args.file,
    result: listImplementations(buildIndexes(model), {
      type: typeof args.options.get("--type") === "string" ? String(args.options.get("--type")) : void 0
    })
  });
}

// src/cli/commands/insertTaskBetweenCommand.ts
var import_promises10 = require("node:fs/promises");
var import_node_path9 = require("node:path");

// src/write/insertTaskBetween.ts
function insertTaskBetweenXml(args) {
  const replacedFlow = args.indexes.sequenceFlowById.get(args.flowId);
  if (!replacedFlow) {
    throw new BpmnCliError("REFERENCE_NOT_FOUND", "Sequence flow not found", 1, { flowId: args.flowId });
  }
  if (replacedFlow.condition) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Conditioned sequence flows are not supported by insert-task-between in P3-A", 1, { flowId: args.flowId });
  }
  const taskType = parseTaskType(args.type ?? "task");
  const incomingFlowId = args.incomingFlowId ?? `${args.flowId}_to_${args.elementId}`;
  const outgoingFlowId = args.outgoingFlowId ?? `${args.elementId}_to_${replacedFlow.targetId}`;
  assertNewId2(args.indexes, args.elementId, "elementId");
  assertNewId2(args.indexes, incomingFlowId, "incomingFlowId");
  assertNewId2(args.indexes, outgoingFlowId, "outgoingFlowId");
  const inserted = {
    id: args.elementId,
    type: taskType.canonicalType,
    name: args.name,
    processId: args.indexes.byId.get(replacedFlow.sourceId)?.processId ?? args.indexes.byId.get(replacedFlow.targetId)?.processId ?? null
  };
  const newFlows = [
    {
      id: incomingFlowId,
      type: "bpmn:SequenceFlow",
      name: null,
      sourceId: replacedFlow.sourceId,
      sourceName: replacedFlow.sourceName,
      targetId: args.elementId,
      targetName: args.name,
      condition: null
    },
    {
      id: outgoingFlowId,
      type: "bpmn:SequenceFlow",
      name: null,
      sourceId: args.elementId,
      sourceName: args.name,
      targetId: replacedFlow.targetId,
      targetName: replacedFlow.targetName,
      condition: null
    }
  ];
  let xml2 = args.xml;
  xml2 = replaceNodeReference2(xml2, replacedFlow.sourceId, "outgoing", args.flowId, incomingFlowId);
  xml2 = replaceNodeReference2(xml2, replacedFlow.targetId, "incoming", args.flowId, outgoingFlowId);
  xml2 = replaceSequenceFlow(xml2, args.flowId, taskType.xmlTag, args.elementId, args.name, newFlows);
  return {
    xml: xml2,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      inserted,
      replacedFlow,
      newFlows,
      warnings: [{
        severity: "warning",
        code: "DI_NOT_UPDATED",
        message: "BPMNDI layout is not updated in P3-A"
      }],
      diff: [
        {
          op: "replace",
          path: `/sequenceFlows/${args.flowId}`,
          before: `${replacedFlow.sourceId}->${replacedFlow.targetId}`,
          after: `${replacedFlow.sourceId}->${args.elementId}->${replacedFlow.targetId}`
        },
        {
          op: "add",
          path: `/elements/${args.elementId}`,
          before: null,
          after: args.name
        },
        {
          op: "add",
          path: `/sequenceFlows/${incomingFlowId}`,
          before: null,
          after: `${replacedFlow.sourceId}->${args.elementId}`
        },
        {
          op: "add",
          path: `/sequenceFlows/${outgoingFlowId}`,
          before: null,
          after: `${args.elementId}->${replacedFlow.targetId}`
        }
      ]
    }
  };
}
function parseTaskType(type) {
  if (type === "task") {
    return { canonicalType: "bpmn:Task", xmlTag: "task" };
  }
  if (type === "userTask") {
    return { canonicalType: "bpmn:UserTask", xmlTag: "userTask" };
  }
  if (type === "serviceTask") {
    return { canonicalType: "bpmn:ServiceTask", xmlTag: "serviceTask" };
  }
  throw new BpmnCliError("INVALID_OPTION_VALUE", `Unsupported insert task type: ${type}`, 2, { type });
}
function assertNewId2(indexes, id, field) {
  if (indexes.byId.has(id) || indexes.sequenceFlowById.has(id)) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `Duplicate id for ${field}`, 2, { [field]: id });
  }
}
function replaceNodeReference2(xml2, elementId, direction, oldFlowId, newFlowId) {
  const escapedId = escapeRegExp6(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml2.match(openPattern);
  if (!open || open.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find flow node opening tag", 1, { elementId });
  }
  const fullOpenTag = open[0];
  const tagName = open[1];
  const closeTag = `</${tagName}>`;
  const closeIndex = xml2.indexOf(closeTag, open.index + fullOpenTag.length);
  if (closeIndex === -1) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find flow node closing tag", 1, { elementId });
  }
  const bodyStart = open.index + fullOpenTag.length;
  const body = xml2.slice(bodyStart, closeIndex);
  const reference = `<bpmn:${direction}>${oldFlowId}</bpmn:${direction}>`;
  if (!body.includes(reference)) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", `Could not find ${direction} reference on flow node`, 1, {
      elementId,
      flowId: oldFlowId
    });
  }
  const updatedBody = body.replace(reference, `<bpmn:${direction}>${newFlowId}</bpmn:${direction}>`);
  return `${xml2.slice(0, bodyStart)}${updatedBody}${xml2.slice(closeIndex)}`;
}
function replaceSequenceFlow(xml2, flowId, taskXmlTag, elementId, name2, newFlows) {
  const escapedId = escapeRegExp6(flowId);
  const flowPattern = new RegExp(`<bpmn:sequenceFlow\\b[^>]*\\bid="${escapedId}"[^>]*>`);
  const flow = xml2.match(flowPattern);
  if (!flow || flow.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find sequence flow tag", 1, { flowId });
  }
  if (!flow[0].endsWith("/>")) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Only self-closing sequence flows are supported by insert-task-between in P3-A", 1, { flowId });
  }
  const lineStart = xml2.lastIndexOf("\n", flow.index) + 1;
  const indent = xml2.slice(lineStart, flow.index).match(/^\s*/)?.[0] ?? "";
  const task = [
    `<bpmn:${taskXmlTag} id="${escapeAttribute5(elementId)}" name="${escapeAttribute5(name2)}">`,
    `${indent}  <bpmn:incoming>${newFlows[0].id}</bpmn:incoming>`,
    `${indent}  <bpmn:outgoing>${newFlows[1].id}</bpmn:outgoing>`,
    `${indent}</bpmn:${taskXmlTag}>`
  ].join("\n");
  const replacement = [
    `<bpmn:sequenceFlow id="${escapeAttribute5(newFlows[0].id)}" sourceRef="${escapeAttribute5(newFlows[0].sourceId)}" targetRef="${escapeAttribute5(newFlows[0].targetId)}" />`,
    task,
    `<bpmn:sequenceFlow id="${escapeAttribute5(newFlows[1].id)}" sourceRef="${escapeAttribute5(newFlows[1].sourceId)}" targetRef="${escapeAttribute5(newFlows[1].targetId)}" />`
  ].join(`
${indent}`);
  return `${xml2.slice(0, flow.index)}${replacement}${xml2.slice(flow.index + flow[0].length)}`;
}
function escapeAttribute5(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp6(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/insertTaskBetweenCommand.ts
async function insertTaskBetweenCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "insert-task-between requires a BPMN file", 2);
  }
  const flowId = requiredString3(args, "--flow", "insert-task-between requires --flow");
  const elementId = requiredString3(args, "--id", "insert-task-between requires --id");
  const name2 = requiredString3(args, "--name", "insert-task-between requires --name");
  const type = args.options.get("--type");
  const incomingFlowId = args.options.get("--incoming-flow-id");
  const outgoingFlowId = args.options.get("--outgoing-flow-id");
  if (type !== void 0 && typeof type !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--type requires a value", 2);
  }
  if (incomingFlowId !== void 0 && typeof incomingFlowId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--incoming-flow-id requires a value", 2);
  }
  if (outgoingFlowId !== void 0 && typeof outgoingFlowId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--outgoing-flow-id requires a value", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = insertTaskBetweenXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    flowId,
    elementId,
    name: name2,
    type: type ?? "task",
    incomingFlowId: incomingFlowId ?? null,
    outgoingFlowId: outgoingFlowId ?? null,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml7(plan.xml);
  if (write) {
    await writeOutput8(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "insert-task-between",
    file: args.file,
    result: plan.result
  });
}
function requiredString3(args, key, message) {
  const value = args.options.get(key);
  if (typeof value !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", message, 2);
  }
  return value;
}
async function validateXml7(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput8(path, payload) {
  try {
    await (0, import_promises10.mkdir)((0, import_node_path9.dirname)(path), { recursive: true });
    await (0, import_promises10.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write inserted BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/cli/commands/lanesCommand.ts
async function lanesCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "lanes requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "lanes",
    file: args.file,
    result: getLanes(buildIndexes(model), {
      elementId: stringOption3(args.options.get("--element"))
    })
  });
}
function stringOption3(value) {
  return typeof value === "string" ? value : void 0;
}

// src/cli/commands/overviewCommand.ts
async function overviewCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "overview requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  return successEnvelope({
    command: "overview",
    file: args.file,
    result: getOverview(model, indexes)
  });
}

// src/query/path.ts
function findPaths(indexes, args) {
  const from = indexes.byId.get(args.from);
  const to = indexes.byId.get(args.to);
  if (!from) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.from });
  }
  if (!to) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.to });
  }
  const paths = collectTargetPaths(indexes, from, to, args.direction, args.depth, args.maxPaths);
  return {
    from,
    to,
    direction: args.direction,
    depth: args.depth,
    paths: paths.paths,
    found: paths.paths.length > 0,
    truncated: paths.truncated
  };
}
function collectTargetPaths(indexes, from, to, direction, depth, maxPaths) {
  const queue = [{ nodes: [from], flows: [], seen: /* @__PURE__ */ new Set([from.id]) }];
  const paths = [];
  let truncated = false;
  while (queue.length > 0) {
    const item = queue.shift();
    const current = item.nodes[item.nodes.length - 1];
    if (current.id === to.id && item.flows.length > 0) {
      if (paths.length < maxPaths) {
        paths.push({
          nodes: item.nodes,
          flows: item.flows,
          depth: item.flows.length,
          cycleDetected: item.cycleDetected || void 0
        });
      } else {
        truncated = true;
      }
      continue;
    }
    if (item.cycleDetected) {
      continue;
    }
    if (item.flows.length >= depth) {
      truncated = true;
      continue;
    }
    for (const flow of nextFlows(indexes, current.id, direction)) {
      const nextId = direction === "forward" ? flow.targetId : flow.sourceId;
      const next = indexes.byId.get(nextId);
      if (!next) {
        continue;
      }
      const repeated = item.seen.has(next.id);
      queue.push({
        nodes: [...item.nodes, next],
        flows: [...item.flows, { id: flow.id, name: flow.name, condition: flow.condition }],
        seen: /* @__PURE__ */ new Set([...item.seen, next.id]),
        cycleDetected: item.cycleDetected || repeated || void 0
      });
    }
  }
  return { paths: paths.sort(comparePath), truncated };
}
function nextFlows(indexes, id, direction) {
  const flows = direction === "forward" ? indexes.outgoingByNodeId.get(id) ?? [] : indexes.incomingByNodeId.get(id) ?? [];
  return [...flows].sort((a, b) => a.id.localeCompare(b.id));
}
function comparePath(a, b) {
  return a.depth - b.depth || a.nodes.map((node) => node.id).join("|").localeCompare(b.nodes.map((node) => node.id).join("|")) || a.flows.map((flow) => flow.id).join("|").localeCompare(b.flows.map((flow) => flow.id).join("|"));
}

// src/cli/commands/pathCommand.ts
async function pathCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "path requires a BPMN file", 2);
  }
  const from = args.options.get("--from");
  if (typeof from !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "path requires --from", 2);
  }
  const to = args.options.get("--to");
  if (typeof to !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "path requires --to", 2);
  }
  const direction = args.options.get("--direction");
  if (direction !== void 0 && direction !== "forward" && direction !== "backward") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--direction must be forward or backward", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "path",
    file: args.file,
    result: findPaths(buildIndexes(model), {
      from,
      to,
      direction: direction === "backward" ? "backward" : "forward",
      depth: numberOption3(args, "--depth", 10),
      maxPaths: numberOption3(args, "--max-paths", 20)
    })
  });
}
function numberOption3(args, name2, fallback) {
  const value = args.options.get(name2);
  if (value === void 0) {
    return fallback;
  }
  if (typeof value !== "string" || !Number.isInteger(Number(value)) || Number(value) < 0) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `${name2} must be a non-negative integer`, 2, { option: name2, value });
  }
  return Number(value);
}

// src/cli/commands/participantsCommand.ts
async function participantsCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "participants requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "participants",
    file: args.file,
    result: getParticipants(model, buildIndexes(model))
  });
}

// src/cli/commands/renameCommand.ts
var import_promises11 = require("node:fs/promises");
var import_node_path10 = require("node:path");

// src/write/renameElement.ts
function renameElementXml(args) {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError("ELEMENT_NOT_FOUND", "Element not found", 1, { elementId: args.elementId });
  }
  const patch = patchOpeningTag2(args.xml, args.elementId, args.name);
  return {
    xml: patch.xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      before: { name: element.name },
      after: { name: args.name },
      diff: [{
        op: patch.operation,
        path: `/elements/${args.elementId}/name`,
        before: element.name,
        after: args.name
      }]
    }
  };
}
function patchOpeningTag2(xml2, elementId, name2) {
  const escapedId = escapeRegExp7(elementId);
  const tagPattern = new RegExp(`<[^!?/][^>]*\\bid="${escapedId}"[^>]*>`);
  const match = xml2.match(tagPattern);
  if (!match || match.index === void 0) {
    throw new BpmnCliError("UNSUPPORTED_BPMN_ELEMENT_TYPE", "Could not find target element opening tag", 1, { elementId });
  }
  const tag = match[0];
  const escapedName = escapeAttribute6(name2);
  const namePattern = /\bname="[^"]*"/;
  const operation = namePattern.test(tag) ? "replace" : "add";
  const updatedTag = operation === "replace" ? tag.replace(namePattern, `name="${escapedName}"`) : tag.replace(/\/?>$/, (suffix) => ` name="${escapedName}"${suffix}`);
  return {
    xml: `${xml2.slice(0, match.index)}${updatedTag}${xml2.slice(match.index + tag.length)}`,
    operation
  };
}
function escapeAttribute6(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeRegExp7(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/cli/commands/renameCommand.ts
async function renameCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "rename requires a BPMN file", 2);
  }
  const elementId = args.options.get("--id");
  if (typeof elementId !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "rename requires --id", 2);
  }
  const name2 = args.options.get("--name");
  if (typeof name2 !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "rename requires --name", 2);
  }
  const write = args.options.get("--write") === true;
  const outputPath = args.options.get("-o");
  if (outputPath !== void 0 && typeof outputPath !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o requires an output path", 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "-o is only allowed with --write", 2);
  }
  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = renameElementXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    elementId,
    name: name2,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });
  await validateXml8(plan.xml);
  if (write) {
    await writeOutput9(targetPath, plan.xml);
  }
  return successEnvelope({
    command: "rename",
    file: args.file,
    result: plan.result
  });
}
async function validateXml8(xml2) {
  try {
    await createBpmnModdle().fromXML(xml2);
  } catch (error3) {
    throw new BpmnCliError("BPMN_PARSE_ERROR", "Patched BPMN XML did not parse", 4, {
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}
async function writeOutput9(path, payload) {
  try {
    await (0, import_promises11.mkdir)((0, import_node_path10.dirname)(path), { recursive: true });
    await (0, import_promises11.writeFile)(path, payload, "utf8");
  } catch (error3) {
    throw new BpmnCliError("OUTPUT_WRITE_ERROR", "Failed to write renamed BPMN", 1, {
      path,
      cause: error3 instanceof Error ? error3.message : String(error3)
    });
  }
}

// src/cli/commands/subprocessCommand.ts
async function subprocessCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "subprocess requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "subprocess",
    file: args.file,
    result: getSubprocesses(buildIndexes(model), {
      id: stringOption4(args.options.get("--id"))
    })
  });
}
function stringOption4(value) {
  return typeof value === "string" ? value : void 0;
}

// src/cli/commands/traceCommand.ts
async function traceCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "trace requires a BPMN file", 2);
  }
  const from = args.options.get("--from");
  if (typeof from !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "trace requires --from", 2);
  }
  const direction = args.options.get("--direction");
  if (direction !== void 0 && direction !== "forward" && direction !== "backward") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "--direction must be forward or backward", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "trace",
    file: args.file,
    result: trace(buildIndexes(model), {
      from,
      direction: direction === "backward" ? "backward" : "forward",
      depth: numberOption4(args, "--depth", 5),
      maxPaths: numberOption4(args, "--max-paths", 20)
    })
  });
}
function numberOption4(args, name2, fallback) {
  const value = args.options.get(name2);
  if (value === void 0) {
    return fallback;
  }
  if (typeof value !== "string" || !Number.isInteger(Number(value)) || Number(value) < 0) {
    throw new BpmnCliError("INVALID_OPTION_VALUE", `${name2} must be a non-negative integer`, 2, { option: name2, value });
  }
  return Number(value);
}

// src/cli/commands/toJsonCommand.ts
var import_promises12 = require("node:fs/promises");
var import_node_path11 = require("node:path");

// src/legacy/optimizations/ids.ts
var OPTIMIZATION_IDS = {
  compactElementMeta: "compactElementMeta",
  compactCallMappings: "compactCallMappings",
  compactFlows: "compactFlows",
  compactConditions: "compactConditions",
  omitRedundantGraphRefs: "omitRedundantGraphRefs",
  omitTopLevelMetadata: "omitTopLevelMetadata",
  stripNamespacePrefixes: "stripNamespacePrefixes"
};
var OPTIMIZATION_ID_VALUES = Object.values(OPTIMIZATION_IDS);
function isOptimizationId(value) {
  return OPTIMIZATION_ID_VALUES.includes(value);
}

// src/legacy/config.ts
var PRESET_NAMES = ["base", "optimized"];
var BUILT_IN_PRESETS = {
  base: {
    optimizations: {
      enabled: []
    },
    output: {
      pretty: true
    }
  },
  optimized: {
    optimizations: {
      enabled: [
        OPTIMIZATION_IDS.compactElementMeta,
        OPTIMIZATION_IDS.compactCallMappings,
        OPTIMIZATION_IDS.compactFlows,
        OPTIMIZATION_IDS.compactConditions,
        OPTIMIZATION_IDS.omitRedundantGraphRefs,
        OPTIMIZATION_IDS.omitTopLevelMetadata,
        OPTIMIZATION_IDS.stripNamespacePrefixes
      ]
    },
    output: {
      pretty: true
    }
  }
};
function getPresetConfig(name2) {
  if (!isCompressionPresetName(name2)) {
    throw new Error(`Unknown compression preset: ${name2}`);
  }
  return cloneConfig(BUILT_IN_PRESETS[name2]);
}
function resolveCompressionConfig(input) {
  if (input === void 0) {
    return getPresetConfig("base");
  }
  if (!isRecord4(input)) {
    throw new Error("Compression config must be an object");
  }
  const config = input;
  const base = config.extends ? getPresetConfig(config.extends) : getPresetConfig("base");
  return validateConfig(mergeConfig(base, config));
}
function mergeConfig(base, override) {
  return cleanConfig({
    fields: mergeNested(base.fields, override.fields),
    optimizations: mergeNested(base.optimizations, override.optimizations),
    output: mergeNested(base.output, override.output)
  });
}
function mergeNested(base, override) {
  if (!base && !override) {
    return void 0;
  }
  return {
    ...base ?? {},
    ...override ?? {}
  };
}
function cleanConfig(config) {
  return JSON.parse(JSON.stringify(config));
}
function cloneConfig(config) {
  return cleanConfig(config);
}
function validateConfig(config) {
  const enabled = config.optimizations?.enabled ?? [];
  for (const id of enabled) {
    if (typeof id !== "string" || !isOptimizationId(id)) {
      throw new Error(`Unknown optimization id: ${String(id)}`);
    }
  }
  return config;
}
function isCompressionPresetName(value) {
  return PRESET_NAMES.includes(value);
}
function isRecord4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/legacy/optimizations/utils.ts
function cloneModel(model) {
  return JSON.parse(JSON.stringify(model));
}
function compactBpmnType(value) {
  if (typeof value !== "string" || value === "") {
    return void 0;
  }
  return value.startsWith("bpmn:") ? value.slice("bpmn:".length) : value;
}
function formatCsvLine(fields) {
  const trimmed = [...fields];
  while (trimmed.length > 0 && !trimmed[trimmed.length - 1]) {
    trimmed.pop();
  }
  return trimmed.map((field) => escapeCsvField(field ?? "")).join(",");
}
function compactCondition(value) {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord5(value)) {
    return void 0;
  }
  const body = typeof value.body === "string" && value.body !== "" ? value.body : void 0;
  const language = typeof value.language === "string" && value.language !== "" ? value.language : void 0;
  if (!body) {
    return void 0;
  }
  return language ? `${body}@${language}` : body;
}
function isRecord5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cleanRecord(value) {
  const entries = Object.entries(value).filter(([, item]) => {
    if (item === void 0 || item === null || item === "") {
      return false;
    }
    if (Array.isArray(item)) {
      return item.length > 0;
    }
    return !(isRecord5(item) && Object.keys(item).length === 0);
  });
  return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
function escapeCsvField(value) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

// src/legacy/optimizations/compact-call-mappings.ts
var compactCallMappingsOptimization = {
  id: OPTIMIZATION_IDS.compactCallMappings,
  apply(model) {
    const next = cloneModel(model);
    const processes = Array.isArray(next.processes) ? next.processes : [];
    for (const process2 of processes) {
      if (!isRecord5(process2) || !Array.isArray(process2.elements)) {
        continue;
      }
      process2.elements = process2.elements.map(compactElementMappings);
    }
    return next;
  }
};
function compactElementMappings(value) {
  if (!isRecord5(value) || !isRecord5(value.extensions)) {
    return value;
  }
  const extensions = { ...value.extensions };
  const inputMappings = compactMappings(extensions["camunda:In"]);
  const outputMappings = compactMappings(extensions["camunda:Out"]);
  delete extensions["camunda:In"];
  delete extensions["camunda:Out"];
  return cleanRecord({
    ...value,
    extensions: cleanRecord(extensions),
    in: inputMappings,
    out: outputMappings
  });
}
function compactMappings(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const mappings = value.map(compactMapping).filter((mapping) => Boolean(mapping));
  return mappings.length > 0 ? mappings : void 0;
}
function compactMapping(value) {
  if (!isRecord5(value)) {
    return void 0;
  }
  const variables = stringValue2(value.variables);
  if (variables === "all") {
    return "*";
  }
  const source = stringValue2(value.source);
  const sourceExpression = stringValue2(value.sourceExpression);
  const target = stringValue2(value.target);
  if (sourceExpression && target) {
    return `=${sourceExpression}->${target}`;
  }
  if (!source || !target) {
    return void 0;
  }
  return source === target ? source : `${source}->${target}`;
}
function stringValue2(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}

// src/legacy/optimizations/compact-conditions.ts
var compactConditionsOptimization = {
  id: OPTIMIZATION_IDS.compactConditions,
  apply(model) {
    const next = cloneModel(model);
    const processes = Array.isArray(next.processes) ? next.processes : [];
    for (const process2 of processes) {
      if (!isRecord5(process2) || !Array.isArray(process2.flows)) {
        continue;
      }
      process2.flows = process2.flows.map(compactFlowCondition);
    }
    return next;
  }
};
function compactFlowCondition(value) {
  if (!isRecord5(value)) {
    return value;
  }
  return cleanRecord({
    ...value,
    condition: compactCondition(value.condition)
  });
}

// src/legacy/optimizations/compact-element-meta.ts
var IMPLEMENTATION_KEYS = [
  "camunda:delegateExpression",
  "camunda:class",
  "camunda:expression",
  "camunda:topic"
];
var compactElementMetaOptimization = {
  id: OPTIMIZATION_IDS.compactElementMeta,
  apply(model) {
    const next = cloneModel(model);
    const processes = Array.isArray(next.processes) ? next.processes : [];
    for (const process2 of processes) {
      if (!isRecord5(process2) || !Array.isArray(process2.elements)) {
        continue;
      }
      process2.type = compactBpmnType(process2.type);
      process2.elements = process2.elements.map(compactElement);
    }
    return next;
  }
};
function compactElement(value) {
  if (!isRecord5(value)) {
    return value;
  }
  const execution = isRecord5(value.execution) ? { ...value.execution } : void 0;
  const extras = [];
  const implementation = extractImplementation(execution);
  if (implementation) {
    extras.push(implementation);
  }
  if (typeof value.calledElement === "string" && value.calledElement !== "") {
    extras.push(value.calledElement);
  }
  const external = extractExternalType(execution);
  if (external) {
    extras.push(external);
  }
  const asyncBefore = extractAsyncBefore(execution);
  if (asyncBefore) {
    extras.push(asyncBefore);
  }
  const meta = formatCsvLine([
    compactBpmnType(value.type),
    stringValue3(value.id),
    stringValue3(value.name),
    ...extras
  ]);
  const compacted = {
    meta,
    ...value,
    id: void 0,
    type: void 0,
    name: void 0,
    calledElement: void 0,
    execution: execution ? cleanRecord(compactExecution(execution)) : void 0
  };
  return cleanRecord(compacted);
}
function extractImplementation(execution) {
  if (!execution) {
    return void 0;
  }
  const present = IMPLEMENTATION_KEYS.map((key2) => [key2, execution[key2]]).filter(([, value2]) => typeof value2 === "string" && value2 !== "");
  if (present.length !== 1) {
    return void 0;
  }
  const [[key, value]] = present;
  delete execution[key];
  return normalizeImplementationValue(value);
}
function extractExternalType(execution) {
  if (!execution || execution["camunda:type"] !== "external") {
    return void 0;
  }
  delete execution["camunda:type"];
  return "external";
}
function extractAsyncBefore(execution) {
  if (!execution || execution["camunda:asyncBefore"] !== true) {
    return void 0;
  }
  delete execution["camunda:asyncBefore"];
  return "asyncBefore";
}
function compactExecution(execution) {
  return Object.fromEntries(Object.entries(execution).map(([key, value]) => [
    stripNamespace(key),
    typeof value === "string" ? stripNamespace(value) : value
  ]));
}
function normalizeImplementationValue(value) {
  const expressionMatch = /^\$\{(.+)\}$/.exec(value);
  return expressionMatch ? expressionMatch[1] : value;
}
function stripNamespace(value) {
  const knownPrefixes = ["bpmn:", "camunda:", "bpmndi:", "dc:", "di:"];
  const prefix2 = knownPrefixes.find((item) => value.startsWith(item));
  return prefix2 ? value.slice(prefix2.length) : value;
}
function stringValue3(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}

// src/legacy/optimizations/compact-flows.ts
var compactFlowsOptimization = {
  id: OPTIMIZATION_IDS.compactFlows,
  apply(model) {
    const next = cloneModel(model);
    const processes = Array.isArray(next.processes) ? next.processes : [];
    for (const process2 of processes) {
      if (!isRecord5(process2) || !Array.isArray(process2.flows)) {
        continue;
      }
      process2.flows = process2.flows.map(compactFlow).filter((flow) => Boolean(flow));
    }
    return next;
  }
};
function compactFlow(value) {
  if (!isRecord5(value)) {
    return void 0;
  }
  return formatCsvLine([
    stringValue4(value.sourceRef ?? value.from),
    stringValue4(value.targetRef ?? value.to),
    stringValue4(value.name),
    compactCondition(value.condition)
  ]);
}
function stringValue4(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}

// src/legacy/optimizations/omit-redundant-graph-refs.ts
var omitRedundantGraphRefsOptimization = {
  id: OPTIMIZATION_IDS.omitRedundantGraphRefs,
  apply(model) {
    const next = cloneModel(model);
    const processes = Array.isArray(next.processes) ? next.processes : [];
    for (const process2 of processes) {
      if (!isRecord5(process2) || !Array.isArray(process2.elements)) {
        continue;
      }
      process2.elements = process2.elements.map(omitElementGraphRefs);
    }
    return next;
  }
};
function omitElementGraphRefs(value) {
  if (!isRecord5(value)) {
    return value;
  }
  return cleanRecord({
    ...value,
    incoming: void 0,
    outgoing: void 0
  });
}

// src/legacy/optimizations/omit-top-level-metadata.ts
var omitTopLevelMetadataOptimization = {
  id: OPTIMIZATION_IDS.omitTopLevelMetadata,
  apply(model) {
    const next = cloneModel(model);
    return cleanRecord({
      ...next,
      definitions: void 0,
      collaborations: void 0
    }) ?? {};
  }
};

// src/legacy/optimizations/strip-namespace-prefixes.ts
var NAMESPACE_PREFIX_PATTERN = /(?:camunda|camunca|bpmn):/gi;
var stripNamespacePrefixesOptimization = {
  id: OPTIMIZATION_IDS.stripNamespacePrefixes,
  apply(model) {
    return stripValue(model);
  }
};
function stripValue(value) {
  if (typeof value === "string") {
    return stripString(value);
  }
  if (Array.isArray(value)) {
    return value.map(stripValue);
  }
  if (!isRecord5(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    stripString(key),
    stripValue(item)
  ]));
}
function stripString(value) {
  return value.replace(NAMESPACE_PREFIX_PATTERN, "");
}

// src/legacy/optimizations/registry.ts
var OPTIMIZATION_REGISTRY = {
  [OPTIMIZATION_IDS.compactElementMeta]: compactElementMetaOptimization,
  [OPTIMIZATION_IDS.compactCallMappings]: compactCallMappingsOptimization,
  [OPTIMIZATION_IDS.compactFlows]: compactFlowsOptimization,
  [OPTIMIZATION_IDS.compactConditions]: compactConditionsOptimization,
  [OPTIMIZATION_IDS.omitRedundantGraphRefs]: omitRedundantGraphRefsOptimization,
  [OPTIMIZATION_IDS.omitTopLevelMetadata]: omitTopLevelMetadataOptimization,
  [OPTIMIZATION_IDS.stripNamespacePrefixes]: stripNamespacePrefixesOptimization
};

// src/legacy/optimizations/pipeline.ts
function applyOptimizations(model, enabled = []) {
  return enabled.reduce((current, id) => {
    const optimization = OPTIMIZATION_REGISTRY[id];
    return optimization.apply(current, { id });
  }, model);
}

// src/legacy/convert.ts
var EXCLUDED_TYPES = /* @__PURE__ */ new Set([
  "bpmndi:BPMNDiagram",
  "bpmndi:BPMNPlane",
  "bpmndi:BPMNShape",
  "bpmndi:BPMNEdge",
  "dc:Bounds",
  "di:waypoint"
]);
var EXCLUDED_KEYS = /* @__PURE__ */ new Set([
  "$parent",
  "diagrams",
  "plane",
  "planeElement",
  "bounds",
  "waypoint",
  "label",
  "BPMNDiagram",
  "targetNamespace",
  "isExecutable",
  "camunda:historyTimeToLive",
  "historyTimeToLive",
  "exporter",
  "exporterVersion"
]);
var EXECUTION_KEY_MAP = /* @__PURE__ */ new Map([
  ["asyncBefore", "camunda:asyncBefore"],
  ["asyncAfter", "camunda:asyncAfter"],
  ["exclusive", "camunda:exclusive"],
  ["delegateExpression", "camunda:delegateExpression"],
  ["class", "camunda:class"],
  ["expression", "camunda:expression"],
  ["topic", "camunda:topic"],
  ["type", "camunda:type"],
  ["assignee", "camunda:assignee"],
  ["candidateUsers", "camunda:candidateUsers"],
  ["candidateGroups", "camunda:candidateGroups"],
  ["formKey", "camunda:formKey"],
  ["resultVariable", "camunda:resultVariable"],
  ["decisionRef", "camunda:decisionRef"],
  ["decisionRefBinding", "camunda:decisionRefBinding"],
  ["decisionRefVersion", "camunda:decisionRefVersion"],
  ["decisionRefVersionTag", "camunda:decisionRefVersionTag"],
  ["mapDecisionResult", "camunda:mapDecisionResult"]
]);
async function convertBpmnToJson(xml2, options = {}) {
  const config = resolveCompressionConfig(options.config ?? (options.preset ? { extends: options.preset } : void 0));
  const moddle = new SimpleBpmnModdle({ camunda: camunda_default });
  const { rootElement, warnings } = await moddle.fromXML(xml2);
  const definitions = rootElement;
  const rootElements = arrayOf4(definitions.rootElements);
  const projected = cleanValue({
    definitions: cleanValue({ id: definitions.id }),
    collaborations: isExcludedByConfig("collaborations", config) ? void 0 : sortItems(rootElements.filter((element) => element.$type === "bpmn:Collaboration").map(projectCollaboration)),
    processes: sortItems(rootElements.filter((element) => element.$type === "bpmn:Process").map(projectProcess)),
    warnings: warnings.map((warning) => cleanValue({ message: warning.message }))
  });
  const optimized = applyOptimizations(projected, config.optimizations?.enabled ?? []);
  return applyFieldExclusions(optimized, config);
}
function projectCollaboration(collaboration) {
  return cleanValue({
    id: collaboration.id,
    name: collaboration.name,
    participants: sortItems(arrayOf4(collaboration.participants).map((participant) => cleanValue({
      id: participant.id,
      name: participant.name,
      processRef: idOf5(participant.processRef)
    })))
  });
}
function projectProcess(process2) {
  const flowElements = arrayOf4(process2.flowElements).filter((element) => !isExcludedElement(element));
  const sequenceFlows = flowElements.filter((element) => element.$type === "bpmn:SequenceFlow");
  const elements = flowElements.filter((element) => element.$type !== "bpmn:SequenceFlow");
  return cleanValue({
    id: process2.id,
    type: process2.$type,
    name: process2.name,
    elements: sortItems(elements.map(projectFlowElement)),
    flows: sortItems(sequenceFlows.map(projectSequenceFlow))
  });
}
function projectFlowElement(element) {
  const execution = projectExecution(element);
  return cleanValue({
    id: element.id,
    type: element.$type,
    name: element.name,
    calledElement: stringValue5(element.calledElement),
    scriptFormat: stringValue5(element.scriptFormat),
    script: projectScript(element.script),
    execution,
    extensions: projectExtensions(element.extensionElements),
    incoming: idsOf(element.incoming),
    outgoing: idsOf(element.outgoing)
  });
}
function projectSequenceFlow(flow) {
  return cleanValue({
    id: flow.id,
    type: flow.$type,
    name: flow.name,
    sourceRef: idOf5(flow.sourceRef),
    targetRef: idOf5(flow.targetRef),
    condition: projectExpression(flow.conditionExpression),
    execution: projectExecution(flow)
  });
}
function projectExecution(element) {
  const execution = {};
  for (const [sourceKey, outputKey] of EXECUTION_KEY_MAP) {
    if (!Object.prototype.hasOwnProperty.call(element, sourceKey)) {
      continue;
    }
    const value = primitiveOrId(element[sourceKey]);
    if (value !== void 0) {
      execution[outputKey] = value;
    }
  }
  return cleanValue(execution);
}
function projectExtensions(value) {
  const extensionElements = isRecord6(value) ? arrayOf4(value.values) : [];
  const grouped = {};
  const fallback = [];
  for (const element of extensionElements) {
    const type = element.$type;
    const projected = projectExtensionObject(element, Boolean(type));
    if (type && projected) {
      grouped[type] = [...grouped[type] ?? [], projected];
      continue;
    }
    fallback.push(projected);
  }
  return cleanValue({
    ...sortObject(grouped),
    other: sortItems(fallback)
  });
}
function projectExtensionObject(element, omitType = false) {
  const projected = omitType ? {} : {
    type: element.$type
  };
  for (const [key, item] of Object.entries(element)) {
    if (key === "$type" || EXCLUDED_KEYS.has(key)) {
      continue;
    }
    const primitive = primitiveOrId(item);
    if (primitive !== void 0) {
      projected[key] = primitive;
    }
  }
  return cleanValue(projected);
}
function projectScript(value) {
  if (typeof value === "string") {
    return stringValue5(value);
  }
  if (isRecord6(value)) {
    return stringValue5(value.body ?? value.value);
  }
  return void 0;
}
function projectExpression(value) {
  if (!isRecord6(value)) {
    return void 0;
  }
  return cleanValue({
    type: value.$type,
    body: stringValue5(value.body),
    language: stringValue5(value.language)
  });
}
function isExcludedByConfig(path, config) {
  return config.fields?.exclude?.includes(path) ?? false;
}
function applyFieldExclusions(value, config) {
  const excludes = config.fields?.exclude ?? [];
  if (excludes.length === 0) {
    return value;
  }
  return cleanValue(excludes.reduce((current, path) => removePath(current, path.split(".")), value));
}
function removePath(value, path) {
  if (path.length === 0) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => removePath(item, path));
  }
  if (!isRecord6(value)) {
    return value;
  }
  const [head, ...tail] = path;
  const next = { ...value };
  if (tail.length === 0) {
    delete next[head];
    return next;
  }
  if (head in next) {
    next[head] = removePath(next[head], tail);
  }
  for (const [key, item] of Object.entries(next)) {
    if (Array.isArray(item)) {
      next[key] = item.map((child) => removePath(child, path));
    }
  }
  return next;
}
function idsOf(value) {
  return arrayOf4(value).map(idOf5).filter((id) => Boolean(id)).sort();
}
function idOf5(value) {
  if (typeof value === "string") {
    return stringValue5(value);
  }
  if (isRecord6(value) && typeof value.id === "string") {
    return stringValue5(value.id);
  }
  return void 0;
}
function primitiveOrId(value) {
  if (typeof value === "string") {
    return stringValue5(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return idOf5(value);
}
function isExcludedElement(element) {
  return Boolean(element.$type && EXCLUDED_TYPES.has(element.$type));
}
function sortItems(items) {
  return [...items].sort((a, b) => sortKey2(a).localeCompare(sortKey2(b)));
}
function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
function sortKey2(value) {
  if (!isRecord6(value)) {
    return String(value);
  }
  return [value.id, value.type ?? value.$type, value.name].map((part) => typeof part === "string" ? part : "").join("|");
}
function cleanValue(value) {
  if (Array.isArray(value)) {
    const cleaned = value.map(cleanValue).filter((item) => item !== void 0);
    return cleaned.length > 0 ? cleaned : void 0;
  }
  if (!isRecord6(value)) {
    if (value === void 0 || value === null || value === "") {
      return void 0;
    }
    return value;
  }
  if (typeof value.$type === "string" && EXCLUDED_TYPES.has(value.$type)) {
    return void 0;
  }
  const entries = Object.entries(value).filter(([key]) => !EXCLUDED_KEYS.has(key)).map(([key, item]) => [key, cleanValue(item)]).filter(([, item]) => item !== void 0).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return void 0;
  }
  return Object.fromEntries(entries);
}
function arrayOf4(value) {
  return Array.isArray(value) ? value : [];
}
function stringValue5(value) {
  return typeof value === "string" && value.trim() !== "" ? value : void 0;
}
function isRecord6(value) {
  return typeof value === "object" && value !== null;
}

// src/cli/commands/toJsonCommand.ts
async function toJsonCommand(args, pretty) {
  const printConfig = stringOption5(args, "--print-config");
  if (printConfig) {
    process.stdout.write(`${JSON.stringify(getPresetConfig(printConfig), null, pretty ? 2 : 0)}
`);
    return;
  }
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "to-json requires a BPMN file", 2);
  }
  const xml2 = await (0, import_promises12.readFile)(args.file, "utf8");
  const converted = await convertBpmnToJson(xml2, { preset: stringOption5(args, "--preset") });
  const output = `${JSON.stringify(converted, null, pretty ? 2 : 0)}
`;
  const outputPath = stringOption5(args, "-o") ?? stringOption5(args, "--output");
  if (!outputPath) {
    process.stdout.write(output);
    return;
  }
  await (0, import_promises12.mkdir)((0, import_node_path11.dirname)(outputPath), { recursive: true });
  await (0, import_promises12.writeFile)(outputPath, output, "utf8");
}
function stringOption5(args, name2) {
  const value = args.options.get(name2);
  return typeof value === "string" ? value : void 0;
}

// src/cli/commands/validateCommand.ts
async function validateCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "validate requires a BPMN file", 2);
  }
  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  const result = validateModel(model, indexes);
  if (!result.valid) {
    process.exitCode = 1;
  }
  return successEnvelope({
    command: "validate",
    file: args.file,
    result
  });
}

// src/query/variables.ts
function getVariables(indexes, args) {
  const usages = [];
  const callActivityMappings = [];
  for (const element of [...indexes.byId.values()].sort(compareElement2)) {
    if (args.element && element.id !== args.element) {
      continue;
    }
    const details = getElementDetails(indexes, element);
    if (!details) {
      continue;
    }
    if (details.kind === "callActivity") {
      const mappings = [...details.inputMappings, ...details.outputMappings];
      const mappingVariables = variableCandidatesFromMappings(mappings);
      if (details.outputMappings.some((mapping) => mapping.variables === "all")) {
        mappingVariables.unshift("*");
      }
      callActivityMappings.push({
        element,
        calledElement: details.calledElement,
        inputMappings: details.inputMappings,
        outputMappings: details.outputMappings,
        variables: [...new Set(mappingVariables)].sort((a, b) => a.localeCompare(b)),
        warnings: details.warnings
      });
      for (const mapping of mappings) {
        const direction = mapping.variables === "all" ? "pass-through" : mapping.direction;
        const names = mapping.variables === "all" ? ["*"] : variableCandidatesFromMappings([mapping]);
        for (const name2 of names) {
          usages.push(cleanUsage({
            name: name2,
            direction,
            source: "callActivityMapping",
            element,
            expression: mapping.sourceExpression,
            mapping
          }));
        }
      }
    }
    if (details.kind === "sequenceFlow" && details.condition) {
      for (const name2 of details.variableCandidates) {
        usages.push({
          name: name2,
          direction: "read",
          source: "sequenceFlowCondition",
          element,
          expression: details.condition
        });
      }
    }
    if (details.kind === "serviceTask") {
      const values = [
        details.implementation.delegateExpression,
        details.implementation.class,
        details.implementation.expression
      ].filter((value) => Boolean(value));
      for (const name2 of variableCandidatesFromValues(values)) {
        usages.push({
          name: name2,
          direction: "unknown",
          source: "implementationExpression",
          element
        });
      }
    }
    if (details.kind === "userTask" && details.formKey) {
      for (const name2 of details.variableCandidates) {
        usages.push({
          name: name2,
          direction: "unknown",
          source: "formKey",
          element
        });
      }
    }
  }
  const filteredUsages = args.name ? usages.filter((usage) => usage.name === args.name) : usages;
  const filteredCallActivityMappings = args.name ? callActivityMappings.map((summary) => ({
    ...summary,
    inputMappings: summary.inputMappings.filter((mapping) => mappingHasName(mapping, args.name)),
    outputMappings: summary.outputMappings.filter((mapping) => mappingHasName(mapping, args.name)),
    variables: summary.variables.filter((name2) => name2 === args.name)
  })).filter((summary) => summary.inputMappings.length > 0 || summary.outputMappings.length > 0 || summary.variables.includes(args.name)) : callActivityMappings;
  return {
    variables: summarizeVariables2(filteredUsages),
    usages: filteredUsages.sort(compareUsage),
    callActivityMappings: filteredCallActivityMappings.sort((a, b) => a.element.id.localeCompare(b.element.id)),
    warnings: []
  };
}
function mappingHasName(mapping, name2) {
  if (mapping.variables === "all" && name2 === "*") {
    return true;
  }
  return variableCandidatesFromMappings([mapping]).includes(name2);
}
function summarizeVariables2(usages) {
  const byName = /* @__PURE__ */ new Map();
  for (const usage of usages) {
    byName.set(usage.name, [...byName.get(usage.name) ?? [], usage]);
  }
  return [...byName.entries()].map(([name2, items]) => ({
    name: name2,
    usageCount: items.length,
    directions: [...new Set(items.map((item) => item.direction))].sort(compareDirection2),
    elements: uniqueElements2(items.map((item) => item.element))
  })).sort((a, b) => a.name.localeCompare(b.name));
}
function uniqueElements2(elements) {
  const byId = /* @__PURE__ */ new Map();
  for (const element of elements) {
    byId.set(element.id, element);
  }
  return [...byId.values()].sort(compareElement2);
}
function cleanUsage(usage) {
  return Object.fromEntries(Object.entries(usage).filter(([, value]) => value !== void 0));
}
function compareUsage(a, b) {
  return a.name.localeCompare(b.name) || a.element.id.localeCompare(b.element.id) || compareDirection2(a.direction, b.direction) || a.source.localeCompare(b.source);
}
function compareElement2(a, b) {
  return a.id.localeCompare(b.id);
}
function compareDirection2(a, b) {
  const order = ["in", "out", "read", "write", "pass-through", "unknown"];
  return order.indexOf(a) - order.indexOf(b);
}

// src/cli/commands/variablesCommand.ts
async function variablesCommand(args) {
  if (!args.file) {
    throw new BpmnCliError("MISSING_FILE_ARGUMENT", "variables requires a BPMN file", 2);
  }
  const element = args.options.get("--element");
  const name2 = args.options.get("--name");
  if (element !== void 0 && typeof element !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "variables --element requires a value", 2);
  }
  if (name2 !== void 0 && typeof name2 !== "string") {
    throw new BpmnCliError("INVALID_OPTION_VALUE", "variables --name requires a value", 2);
  }
  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: "variables",
    file: args.file,
    result: getVariables(buildIndexes(model), { element, name: name2 })
  });
}

// src/cli/main.ts
async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.length === 0) {
    process.stdout.write("Usage: bpmn-agent-cli <command> [file] [options]\n");
    return;
  }
  const parsed = parseArgs(args);
  const pretty = parsed.options.get("--pretty") === true;
  const traceMetricsPath = parsed.options.get("--trace-metrics");
  const startedAt = Date.now();
  let stdoutBytes = 0;
  let errorCode = null;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  if (typeof traceMetricsPath === "string") {
    process.stdout.write = ((chunk, ...rest) => {
      stdoutBytes += typeof chunk === "string" ? Buffer.byteLength(chunk, "utf8") : chunk.byteLength;
      return originalStdoutWrite(chunk, ...rest);
    });
  }
  try {
    if (parsed.command === "overview") {
      writeJson(await overviewCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "validate") {
      writeJson(await validateCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "find") {
      writeJson(await findCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "element") {
      writeJson(await elementCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "variables") {
      writeJson(await variablesCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "call-activity") {
      writeJson(await callActivityCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "gateway") {
      writeJson(await gatewayCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "trace") {
      writeJson(await traceCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "context") {
      writeJson(await contextCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "implementations") {
      writeJson(await implementationsCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "participants") {
      writeJson(await participantsCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "lanes") {
      writeJson(await lanesCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "events") {
      writeJson(await eventsCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "subprocess") {
      writeJson(await subprocessCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "path") {
      writeJson(await pathCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "export") {
      await exportCommand(parsed, pretty);
      return;
    }
    if (parsed.command === "rename") {
      writeJson(await renameCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "documentation") {
      writeJson(await documentationCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "implementation") {
      writeJson(await implementationCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "format") {
      writeJson(await formatCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "insert-task-between") {
      writeJson(await insertTaskBetweenCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "connect") {
      writeJson(await connectCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "delete-safe") {
      writeJson(await deleteSafeCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "add-boundary-event") {
      writeJson(await addBoundaryEventCommand(parsed), pretty);
      return;
    }
    if (parsed.command === "to-json") {
      await toJsonCommand(parsed, pretty);
      return;
    }
    throw new BpmnCliError("INVALID_COMMAND", `Unknown command: ${parsed.command}`, 2);
  } catch (error3) {
    errorCode = error3 instanceof BpmnCliError ? error3.code : "INTERNAL_ERROR";
    writeJson(errorEnvelope(error3), pretty);
    process.exitCode = process.exitCode ?? toExitCode(error3);
  } finally {
    process.stdout.write = originalStdoutWrite;
    if (typeof traceMetricsPath === "string") {
      const exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
      const entry = await buildTraceMetricsEntry({
        command: parsed.command,
        file: parsed.file,
        args,
        durationMs: Date.now() - startedAt,
        exitCode,
        stdoutBytes,
        errorCode
      });
      await appendTraceMetricsEntry(traceMetricsPath, entry);
    }
  }
}
main().catch((error3) => {
  process.stderr.write(`${error3 instanceof Error ? error3.message : String(error3)}
`);
  process.exitCode = 5;
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
