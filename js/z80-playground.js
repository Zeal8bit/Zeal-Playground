/**
 * CodeMirror, copyright (c) by Marijn Haverbeke and others
 * Distributed under an MIT license: https://codemirror.net/5/LICENSE
 *
 * Copyright (c) 2025 Zeal 8-bit Computer <contact@zeal8bit.com>; David Higgins <zoul0813@me.com>
 * Changes: renamed to z80-playground, removed ez80 support, added label support, fixed register class name
 */

(function (mod) {
  if (typeof exports == 'object' && typeof module == 'object')
    // CommonJS
    mod(require('../../lib/codemirror'));
  else if (typeof define == 'function' && define.amd)
    // AMD
    define(['../../lib/codemirror'], mod);
  // Plain browser env
  else mod(CodeMirror);
})(function (CodeMirror) {
  'use strict';

  CodeMirror.defineMode('z80-playground', function (_config, parserConfig) {
    const keywords1 =
      /^(exx?|(ld|cp|in)([di]r?)?|pop|push|ad[cd]|cpl|daa|dec|inc|neg|sbc|sub|and|bit|[cs]cf|x?or|res|set|r[lr]c?a?|r[lr]d|s[lr]a|srl|djnz|nop|rst|[de]i|halt|im|ot[di]r|out[di]?)\b/i;
    const keywords2 = /^(call|j[pr]|ret[in]?|b_?(call|jump))\b/i;
    const variables1 = /^(af?|bc?|c|de?|e|hl?|l|i[xy]?|r|sp)\b/i;
    const variables2 = /^(n?[zc]|p[oe]?|m)\b/i;
    const errors = /^([hl][xy]|i[xy][hl]|slia|sll)\b/i;
    const numbers = /^(0x[0-9a-f]+|0b[01]+|[0-9a-f]+h|[01]+b|\d+d?)\b/i;

    return {
      startState: function () {
        return {
          context: 0,
        };
      },
      token: function (stream, state) {
        if (!stream.column()) state.context = 0;

        if (stream.eatSpace()) return null;

        let w;

        // Match labels at the start of a line: e.g. LOOP:
        if (stream.sol() && stream.match(/^[A-Za-z_.$][\w.$]*:/)) {
          return 'special'; // custom token type
        }

        if (stream.eatWhile(/\w/)) {
          w = stream.current();

          if (stream.indentation()) {
            // match UPPER_CASE_MACRO calls
            if (state.context == 0 && stream.current().match(/^[A-Z][A-Z0-9_]*$/)) {
              state.context = 1;
              return 'keyword';
            }

            if ((state.context == 1 || state.context == 4) && variables1.test(w)) {
              state.context = 4;
              return 'variable-2';
            }

            if (state.context == 2 && variables2.test(w)) {
              state.context = 4;
              return 'variable-3';
            }

            if (keywords1.test(w)) {
              state.context = 1;
              return 'keyword';
            } else if (keywords2.test(w)) {
              state.context = 2;
              return 'keyword';
            } else if (numbers.test(w)) {
              return 'number';
            }

            if (errors.test(w)) return 'error';
          } else if (stream.match(numbers)) {
            return 'number';
          } else {
            return null;
          }
        } else if (stream.eat(';')) {
          stream.skipToEnd();
          return 'comment';
        } else if (stream.eat('"')) {
          while ((w = stream.next())) {
            if (w == '"') break;

            if (w == '\\') stream.next();
          }
          return 'string';
        } else if (stream.eat("'")) {
          if (stream.match(/\\?.'/)) return 'number';
        } else if (stream.eat('.') || (stream.sol() && stream.eat('#'))) {
          state.context = 5;

          if (stream.eatWhile(/\w/)) return 'def';
        } else if (stream.eat('$')) {
          if (stream.eatWhile(/[\da-f]/i)) return 'number';
        } else if (stream.eat('%')) {
          if (stream.eatWhile(/[01]/)) return 'number';
        } else {
          stream.next();
        }

        return null;
      },
    };
  });

  CodeMirror.defineMIME('text/x-z80', 'z80');
});
