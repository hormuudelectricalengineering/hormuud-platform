/**
 * Web stub for react-native-worklets.
 * react-native-worklets is a native-only package that does not support web.
 * This shim provides no-op implementations so that react-native-reanimated
 * can be imported on web without crashing the bundler.
 */

const RuntimeKind = {
  JS: 'JS',
  UI: 'UI',
  default: 'JS',
};

const WorkletsModule = {
  makeShareableClone: () => null,
  scheduleOnUI: (fn) => fn,
  executeOnUIRuntimeSync: (fn) => fn,
  createWorkletRuntime: () => null,
  scheduleOnRuntime: () => {},
};

const noop = () => {};
const identity = (v) => v;
const asyncNoop = async () => {};

module.exports = {
  RuntimeKind,
  WorkletsModule,
  makeShareable: identity,
  makeShareableCloneRecursive: identity,
  makeShareableCloneOnUIRecursive: identity,
  shareableMappingCache: new WeakMap(),
  serializableMappingCache: new WeakMap(),
  isShareableRef: () => false,
  isSynchronizable: () => false,
  isSerializableRef: () => false,
  isWorkletFunction: () => false,
  getRuntimeKind: () => RuntimeKind.JS,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  runOnUIAsync: (fn) => async (...args) => fn(...args),
  runOnUISync: (fn) => fn,
  scheduleOnRN: (fn) => fn,
  scheduleOnUI: identity,
  callMicrotasks: noop,
  executeOnUIRuntimeSync: (fn) => fn,
  unstable_eventLoopTask: identity,
  createWorkletRuntime: () => null,
  runOnRuntime: (runtime, fn) => fn,
  createSerializable: identity,
  createSynchronizable: identity,
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: noop,
  init: noop,
};
