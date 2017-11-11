'use strict';

async function init() {
  window.addEventListener('unload', destroy, {once: true});
  addListeners();
}

function destroy() {
  removeListeners();
}

function addListeners() {
}

function removeListeners() {
}

window.addEventListener('DOMContentLoaded', init, {once: true});
