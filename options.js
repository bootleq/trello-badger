'use strict';

let $board    = document.querySelector('input.board-url');
let $badges   = document.querySelector('ul.badges');
let $addBadge = document.querySelector('button.add-badge');
let $save     = document.querySelector('#save');
let $saved    = document.querySelector('#main-ctrls .info');

let badgeTmpl = document.querySelector('#badge-template').content;

async function load() {
  browser.storage.local.get({board: '', badges: []}).then(items => {
    $board.value = items['board'] || '';

    for (let cfg of items['badges']) {
      this.addBadge(cfg);
    };
  });
}

function addBadge(cfg = {}) {
  let badge = {
    name:  cfg.name  || '',
    label: cfg.label || '',
    func:  cfg.func
  };

  let tmpl = document.importNode(badgeTmpl, true);

  tmpl.querySelector('input.name').value  = badge.name;
  tmpl.querySelector('input.label').value = badge.label;
  tmpl.querySelector('select.func').value = badge.func;
  $badges.appendChild(tmpl);
}

async function save() {
  let board = document.querySelector('input.board-url').value;

  let badges = Array.from($badges.querySelectorAll('.badges > li')).reduce((list, $i) => {
    list.push({
      name:  $i.querySelector('input.name').value,
      label: $i.querySelector('input.label').value,
      func:  $i.querySelector('select.func').value
    });
    return list;
  }, []);

  return browser.storage.local.set({board: board, badges: badges});
}

async function init() {
  this.load();

  $addBadge.addEventListener('click', () => {
    this.addBadge();
  });

  $save.addEventListener('click', () => {
    $save.disabled = true;
    $saved.className = 'info';

    save().then(() => {
      $save.disabled = false;
      $saved.classList.add('success');
    })
    .catch(e => {
      console.log('fail saving config', e);
      $saved.classList.add('fail');
      $save.disabled = false;
    });
  });

  $saved.addEventListener('click', () => $saved.className = 'info');
}

window.addEventListener('DOMContentLoaded', init, {once: true});
