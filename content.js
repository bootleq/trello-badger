'use strict';

const listTotalClass = 'trello-badger-addon-total';

let $board;
let schema = [];

let observer = new MutationObserver((mutations) => { // {{{
  let dirtyNodes = [];

  mutations.forEach(m => {

    // omit known irrelevant mutations
    if (m.target.classList.contains('trello-badger-addon-total')) {
      return;
    }

    switch (m.type) {
    case 'childList':
      switch (true) {

        // badge text change
        case m.target.matches('.badge'):
          if (
            Reflect.apply([].some, m.addedNodes,   [n => n.matches('.badge-text')]) ||
            Reflect.apply([].some, m.removedNodes, [n => n.matches('.badge-text')])
          ) {
            dirtyNodes.push(m.target);
          }
          break;

        // badge added or removed
        case m.target.matches('.js-plugin-badges span'):
          if (!m.removedNodes.length && m.addedNodes.length === 1) {
            if (Reflect.apply([].some, m.addedNodes, [n => n.classList.contains('badge')])) {
              dirtyNodes.push(m.target);
            }
          } else if (m.removedNodes.length === 1 && !m.addedNodes.length) {
            if (Reflect.apply([].some, m.removedNodes, [n => n.classList.contains('badge')])) {
              dirtyNodes.push(m.target);
            }
          }
          break;

        // card added or removed
        case m.target.classList.contains('list-header-num-cards') && m.addedNodes.length === 1:
          dirtyNodes.push(m.target);
          break;

        default:
          // console.log(m.type, m);
      }
      break;

    default:
      // console.log(m.type, m);
    }
  });

  if (dirtyNodes.length) {
    dirtyNodes = [...new Set(dirtyNodes)];
    let lists = dirtyNodes.reduce((nodes, n) => {
      nodes.add(n.closest('div.list'));
      return nodes;
    }, new Set());
    lists.forEach(i => updateListTotal(i));
  }
});
// }}}

function updateConfig(items) {
  let $boardName = document.querySelector('.board-header-btn-name .board-header-btn-text');
  if ($boardName && $boardName.textContent === items.board) {
    schema = items.badges;
    start();
  } else {
    stop();
  }
}

async function init() {
  window.addEventListener('unload', destroy, {once: true});

  $board = document.querySelector('#board');

  browser.storage.local.get({board: '', badges: []}).then(items => {
    updateConfig(items);
  });

  browser.storage.onChanged.addListener((changes) => {
    let board  = 'board'  in changes ? changes.board  : '';
    let badges = 'badges' in changes ? changes.badges : [];

    return updateConfig({board: board, badges: badges});
  });
}

function start() {
  observer.observe($board, {
    childList: true,
    characterData: true,
    attributes: false,
    subtree: true
  });
}

function stop() {
  observer.disconnect();
}

function destroy() {
  stop();
}

function updateListTotal($list) {
  let $total = $list.querySelector(`.list-header .${listTotalClass}`);

  let collection = schema.reduce((ary, s) => {
    if (s.func === 'subtotal') {
      ary.push({
        name: s.name,
        label: s.label,
        total: 0
      });
    }
    return ary;
  }, []);

  $list.querySelectorAll('.list-card-details .badges').forEach($badges => {
    // collect plugin badge values
    $badges.querySelectorAll('.js-plugin-badges .badge-text').forEach($text => {
      let match = collection.find(c => {
        return $text.textContent.startsWith(c.label);
      });
      if (match) {
        let text = $text.textContent.replace(match.label, '');
        let num = Number(text.replace(/\D/, ''));
        if (!Number.isNaN(num)) {
          match.total += num;
        }
      }
    });
  });

  if (!$total) {
    $total = document.createElement('div');
    $total.className = listTotalClass;
    $list.querySelector('.list-header').appendChild($total);
    $total = $list.querySelector(`.list-header .${listTotalClass}`);
  }

  $total.innerHTML = '';
  collection.forEach(c => {
    let $count = document.createElement('span');
    let $label = document.createElement('span');
    let $number = document.createElement('span');
    $label.textContent = c.label;
    $number.textContent = c.total;
    $count.appendChild($label);
    $count.appendChild($number);
    $total.appendChild($count);
  });
}

window.addEventListener('DOMContentLoaded', init, {once: true});
