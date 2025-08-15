(() => {
  // utils/utils.js
  var norm = (xs) => xs.map((lx) => {
    let l = lx.line;
    l = l.replace("&lt;", "<");
    l = l.replace("&gt;", ">");
    while (l[l.length - 1] == " ") {
      l = l.substr(0, l.length - 1);
    }
    lx.line = l;
    if (l[0] != " ") {
      return lx;
    }
    while (l[0] == " ") {
      l = l.substr(1);
    }
    lx.line = " " + l;
    return lx;
  });
  var nonempty = (xs) => xs.filter((lx) => {
    let l = lx.line;
    while (l[0] == " ") {
      l = l.substr(1);
    }
    return l.length ? true : false;
  });
  var noncomments = (xs) => {
    return xs.map((obj) => ({
      ...obj,
      line: obj.line.split(";")[0]
    }));
  };
  var toInternal = (xs) => {
    let numLine = 1;
    return xs.map((line) => ({
      line,
      // Original line text
      numline: numLine++,
      // Line number (1-based)
      addr: null,
      // Address in code (filled later)
      bytes: 0
      // Number of bytes for this instruction (filled later)
    }));
  };
  var toHexN = (n, d) => {
    let s = n.toString(16);
    while (s.length < d) {
      s = "0" + s;
    }
    return s.toUpperCase();
  };
  var toHex2 = (n) => toHexN(n & 255, 2);
  var toHex4 = (n) => toHexN(n, 4);

  // listing.js
  var lst = (result, raw, compact = false) => {
    let V = result.dump;
    let vars = result.vars;
    let opts = result.opts;
    let ln;
    let op;
    let out = "";
    for (let i = 0, j = V.length; i < j; i++) {
      op = V[i];
      ln = "";
      if (op.macro && !raw) {
      }
      if (op.addr !== void 0 && !op.ifskip) {
        ln += toHex4(op.addr);
        if (op.phase) {
          ln += " @" + toHex4(op.addr - op.phase);
        }
        ln += compact ? " " : "   ";
      }
      if (op.lens && !op.ifskip) {
        for (let n = 0; n < op.lens.length; n++) {
          ln += toHex2(op.lens[n]) + " ";
        }
      }
      if (!compact)
        while (ln.length < 20) {
          ln += " ";
        }
      if (compact)
        while (ln.length < 15) {
          ln += " ";
        }
      if (op.listing) {
        out += ln + op.listing + "\n";
        continue;
      }
      if (op.label) {
        ln += op.label + ":   ";
      }
      if (!compact)
        while (ln.length < 30) {
          ln += " ";
        }
      if (compact)
        while (ln.length < 22) {
          ln += " ";
        }
      if (op.opcode) {
        ln += op.opcode + (compact ? " " : "   ");
      }
      if (op.bandPar) {
        ln += op.bandPar + ",";
      }
      if (op.aimPar) {
        ln += op.aimPar + ",";
      }
      if (op.params) {
        ln += op.params + (compact ? " " : "   ");
      }
      if (op.remark) {
        ln += ";" + op.remark;
      }
      out += ln + "\n";
    }
    if (raw) return out;
    out += "\n\n";
    let xref = opts.xref;
    for (let k in xref) {
      if (xref[k] === null) continue;
      if (k[0] == "_" && k[1] == "_") continue;
      if (k[k.length - 1] === "$") continue;
      ln = "";
      ln += k + ": ";
      while (ln.length < 20) {
        ln += " ";
      }
      ln += toHex4(xref[k].value);
      ln += " DEFINED AT LINE " + xref[k].defined.line;
      if (xref[k].defined.file != "*main*") ln += " IN " + xref[k].defined.file;
      out += ln + "\n";
      if (xref[k].usage) {
        for (let j = 0; j < xref[k].usage.length; j++) {
          out += "                    > USED AT LINE " + xref[k].usage[j].line;
          if (xref[k].usage[j].file != "*main*")
            out += " IN " + xref[k].usage[j].file;
          out += "\n";
        }
      }
    }
    return out;
  };
  var html = (result, raw, compact = false) => {
    let V = result.dump;
    let vars = result.vars;
    let opts = result.opts;
    let parfix = (par) => {
      par += "";
      for (let k in vars) {
        if (vars[k] === null) continue;
        if (k[0] == "_" && k[1] == "_") continue;
        if (k[k.length - 1] === "$") continue;
        let re = new RegExp("^" + k + "$", "i");
        if (par.match(re)) {
          return '<a href="#LBL' + k + '">' + par + "</a>";
        }
      }
      return par;
    };
    let ln;
    let op;
    let out = "<html><head><meta charset=utf-8><body><table>";
    for (let i = 0, j = V.length; i < j; i++) {
      op = V[i];
      ln = '<tr id="ln' + op.numline + '">';
      if (op.macro && !raw) {
      }
      if (op.addr !== void 0) {
        ln += '<td><a name="ADDR' + toHex4(op.addr) + '">' + toHex4(op.addr) + "</a>";
        if (op.phase) {
          ln += "</td><td>" + toHex4(op.addr - op.phase);
        } else ln += "</td><td>";
        ln += "</td>";
      } else ln += "<td></td><td></td>";
      if (op.lens) {
        ln += "<td>";
        for (let n = 0; n < op.lens.length; n++) {
          ln += toHex2(op.lens[n]) + " ";
        }
        ln += "</td>";
      } else ln += "<td></td>";
      if (op.label) {
        ln += '<td><a name="LBL' + op.label + '">' + op.label + "</a></td>";
      } else ln += "<td></td>";
      if (op.opcode) {
        ln += "<td>" + op.opcode + "</td>";
      } else ln += "<td></td>";
      if (op.params) {
        ln += "<td>" + op.params.map(parfix) + "</td>";
      } else ln += "<td></td>";
      if (op.remark) {
        ln += "<td>;" + op.remark + "</td>";
      } else ln += "<td></td>";
      out += ln + "</tr>\n";
    }
    out += "</table>";
    return out;
  };

  // expression-parser.js
  function object(o) {
    function F() {
    }
    F.prototype = o;
    return new F();
  }
  var TNUMBER = 0;
  var TOP1 = 1;
  var TOP2 = 2;
  var TVAR = 3;
  var TFUNCALL = 4;
  function Token(type_, index_, prio_, number_) {
    this.type_ = type_;
    this.index_ = index_ || 0;
    this.prio_ = prio_ || 0;
    this.number_ = number_ !== void 0 && number_ !== null ? number_ : 0;
    this.toString = function() {
      switch (this.type_) {
        case TNUMBER:
          return this.number_;
        case TOP1:
        case TOP2:
        case TVAR:
          return this.index_;
        case TFUNCALL:
          return "CALL";
        default:
          return "Invalid Token";
      }
    };
  }
  function Expression(tokens, ops1, ops2, functions) {
    this.tokens = tokens;
    this.ops1 = ops1;
    this.ops2 = ops2;
    this.functions = functions;
  }
  Expression.prototype = {
    /*
        simplify: function (values) {
          values = values || {};
          let nstack = [];
          let newexpression = [];
          let n1;
          let n2;
          let f;
          let L = this.tokens.length;
          let item;
          let i = 0;
          for (i = 0; i < L; i++) {
            item = this.tokens[i];
            let type_ = item.type_;
            if (type_ === TNUMBER) {
              nstack.push(item);
            } else if (type_ === Tlet && item.index_ in values) {
              item = new Token(TNUMBER, 0, 0, values[item.index_]);
              nstack.push(item);
            } else if (type_ === TOP2 && nstack.length > 1) {
              n2 = nstack.pop();
              n1 = nstack.pop();
              f = this.ops2[item.index_];
              item = new Token(TNUMBER, 0, 0, f(n1.number_, n2.number_));
              nstack.push(item);
            } else if (type_ === TOP1 && nstack.length > 0) {
              n1 = nstack.pop();
              f = this.ops1[item.index_];
              item = new Token(TNUMBER, 0, 0, f(n1.number_));
              nstack.push(item);
            } else {
              while (nstack.length > 0) {
                newexpression.push(nstack.shift());
              }
              newexpression.push(item);
            }
          }
          while (nstack.length > 0) {
            newexpression.push(nstack.shift());
          }
    
          return new Expression(
            newexpression,
            object(this.ops1),
            object(this.ops2),
            object(this.functions)
          );
        },
    
        substitute: function (variable, expr) {
          if (!(expr instanceof Expression)) {
            expr = new Parser().parse(String(expr));
          }
          let newexpression = [];
          let L = this.tokens.length;
          let item;
          let i = 0;
          for (i = 0; i < L; i++) {
            item = this.tokens[i];
            let type_ = item.type_;
            if (type_ === Tlet && item.index_ === variable) {
              for (let j = 0; j < expr.tokens.length; j++) {
                let expritem = expr.tokens[j];
                let replitem = new Token(
                  expritem.type_,
                  expritem.index_,
                  expritem.prio_,
                  expritem.number_
                );
                newexpression.push(replitem);
              }
            } else {
              newexpression.push(item);
            }
          }
    
          let ret = new Expression(
            newexpression,
            object(this.ops1),
            object(this.ops2),
            object(this.functions)
          );
          return ret;
        },
        */
    evaluate: function(values) {
      values = values || {};
      let nstack = [];
      let n1;
      let n2;
      let f;
      let L = this.tokens.length;
      let item;
      let i = 0;
      for (i = 0; i < L; i++) {
        item = this.tokens[i];
        let type_ = item.type_;
        if (type_ === TNUMBER) {
          nstack.push(item.number_);
        } else if (type_ === TOP2) {
          n2 = nstack.pop();
          n1 = nstack.pop();
          f = this.ops2[item.index_];
          nstack.push(f(n1, n2));
        } else if (type_ === TVAR) {
          item.index_ = item.index_.toUpperCase();
          if (item.index_[0] === "<") {
            if (item.index_.substr(1) in values) {
              nstack.push(values[item.index_.substr(1)] % 256);
            }
          } else if (item.index_[0] === ">") {
            if (item.index_.substr(1) in values) {
              nstack.push(Math.floor(values[item.index_.substr(1)] / 256));
            }
          } else if (item.index_ in values) {
            nstack.push(values[item.index_]);
          } else if (item.index_ in this.functions) {
            nstack.push(this.functions[item.index_]);
          } else {
            throw { msg: "undefined variable: " + item.index_ };
          }
        } else if (type_ === TOP1) {
          n1 = nstack.pop();
          f = this.ops1[item.index_];
          nstack.push(f(n1));
        } else if (type_ === TFUNCALL) {
          n1 = nstack.pop();
          f = nstack.pop();
          if (f.apply && f.call) {
            if (Object.prototype.toString.call(n1) == "[object Array]") {
              nstack.push(f.apply(void 0, n1));
            } else {
              nstack.push(f.call(void 0, n1));
            }
          } else {
            throw { msg: f + " is not a function" };
          }
        } else {
          throw { msg: "invalid Expression" };
        }
      }
      if (nstack.length > 1) {
        throw { msg: "invalid Expression (parity)" };
      }
      let ev = nstack[0];
      let pragmas = values.__PRAGMAS;
      if (pragmas && typeof ev == "number") {
        if (pragmas.indexOf("ROUNDFLOAT") >= 0) ev = Math.round(ev);
        if (pragmas.indexOf("FLOAT") >= 0) return ev;
        if (pragmas.indexOf("NOFLOAT") >= 0) return parseInt(ev);
      }
      if (typeof ev == "number") ev = parseInt(ev);
      return ev;
    },
    usage: function(values) {
      values = values || {};
      let xref = [];
      let nstack = [];
      let n1;
      let n2;
      let f;
      let L = this.tokens.length;
      let item;
      let i = 0;
      for (i = 0; i < L; i++) {
        item = this.tokens[i];
        let type_ = item.type_;
        if (type_ === TNUMBER) {
          nstack.push(item.number_);
        } else if (type_ === TOP2) {
          n2 = nstack.pop();
          n1 = nstack.pop();
          f = this.ops2[item.index_];
          nstack.push(f(n1, n2));
        } else if (type_ === TVAR) {
          item.index_ = item.index_.toUpperCase();
          if (item.index_[0] === "<") {
            if (item.index_.substr(1) in values) {
              nstack.push(values[item.index_.substr(1)] % 256);
              xref.push(item.index_.substr(1));
            }
          } else if (item.index_[0] === ">") {
            if (item.index_.substr(1) in values) {
              nstack.push(Math.floor(values[item.index_.substr(1)] / 256));
              xref.push(item.index_.substr(1));
            }
          } else if (item.index_ in values) {
            nstack.push(values[item.index_]);
            xref.push(item.index_);
          } else if (item.index_ in this.functions) {
            nstack.push(this.functions[item.index_]);
            xref.push(item.index_);
          } else {
            throw { msg: "undefined variable: " + item.index_ };
          }
        } else if (type_ === TOP1) {
          n1 = nstack.pop();
          f = this.ops1[item.index_];
          nstack.push(f(n1));
        } else if (type_ === TFUNCALL) {
          n1 = nstack.pop();
          f = nstack.pop();
          if (f.apply && f.call) {
            if (Object.prototype.toString.call(n1) == "[object Array]") {
              nstack.push(f.apply(void 0, n1));
            } else {
              nstack.push(f.call(void 0, n1));
            }
          } else {
            throw { msg: f + " is not a function" };
          }
        } else {
          throw { msg: "invalid Expression" };
        }
      }
      if (nstack.length > 1) {
        throw { msg: "invalid Expression (parity)" };
      }
      return xref;
    }
    /*
    toString: function (toJS) {
      let nstack = [];
      let n1;
      let n2;
      let f;
      let L = this.tokens.length;
      let item;
      let i = 0;
      for (i = 0; i < L; i++) {
        item = this.tokens[i];
        let type_ = item.type_;
        if (type_ === TNUMBER) {
          nstack.push(escapeValue(item.number_));
        } else if (type_ === TOP2) {
          n2 = nstack.pop();
          n1 = nstack.pop();
          f = item.index_;
          if (toJS && f == "^") {
            nstack.push("Math.pow(" + n1 + "," + n2 + ")");
          } else {
            nstack.push("(" + n1 + f + n2 + ")");
          }
        } else if (type_ === TVAR) {
          nstack.push(item.index_);
        } else if (type_ === TOP1) {
          n1 = nstack.pop();
          f = item.index_;
          if (f === "-") {
            nstack.push("(" + f + n1 + ")");
          } else {
            nstack.push(f + "(" + n1 + ")");
          }
        } else if (type_ === TFUNCALL) {
          n1 = nstack.pop();
          f = nstack.pop();
          nstack.push(f + "(" + n1 + ")");
        } else {
          throw {msg: "invalid Expression"};
        }
      }
      if (nstack.length > 1) {
        throw {msg: "invalid Expression (parity)"};
      }
      return nstack[0];
    },
    */
    /*
        variables: function () {
          let L = this.tokens.length;
          let vars = [];
          for (let i = 0; i < L; i++) {
            let item = this.tokens[i];
            if (item.type_ === Tlet && vars.indexOf(item.index_) == -1) {
              vars.push(item.index_);
            }
          }
    
          return vars;
        },
        */
    /*
    toJSFunction: function (param, variables) {
      let f = new Function(
        param,
        "with(Parser.values) { return " +
          this.simplify(variables).toString(true) +
          "; }"
      );
      return f;
    },
    */
  };
  function stringCode(s) {
    let o = 0;
    for (let i = 0; i < s.length; i++) {
      o *= 256;
      o += s.charCodeAt(i);
    }
    return o;
  }
  function add(a, b) {
    if (typeof a == "string") {
      a = stringCode(a);
    }
    if (typeof b == "string") {
      b = stringCode(b);
    }
    return Number(a) + Number(b);
  }
  function fand(a, b) {
    return Number(a) & Number(b);
  }
  function fnebo(a, b) {
    return Number(a) | Number(b);
  }
  function fbequ(a, b) {
    return Number(a) == Number(b) ? 1 : 0;
  }
  function fbnequ(a, b) {
    return Number(a) == Number(b) ? 0 : 1;
  }
  function fblt(a, b) {
    return Number(a) < Number(b) ? 1 : 0;
  }
  function fbgt(a, b) {
    return Number(a) > Number(b) ? 1 : 0;
  }
  function fble(a, b) {
    return Number(a) <= Number(b) ? 1 : 0;
  }
  function fbge(a, b) {
    return Number(a) >= Number(b) ? 1 : 0;
  }
  function sub(a, b) {
    if (typeof a == "string") {
      a = stringCode(a);
    }
    if (typeof b == "string") {
      b = stringCode(b);
    }
    return Number(a) - Number(b);
  }
  function mul(a, b) {
    if (typeof a == "string") {
      let out = "";
      for (let l = 0; l < b; l++) out += a;
      return out;
    }
    return a * b;
  }
  function div(a, b) {
    return a / b;
  }
  function mod(a, b) {
    return a % b;
  }
  function concat(a, b) {
    return "" + a + b;
  }
  function neg(a) {
    return -a;
  }
  function random(a) {
    return Math.random() * (a || 1);
  }
  function fac(a) {
    a = Math.floor(a);
    let b = a;
    while (a > 1) {
      b = b * --a;
    }
    return b;
  }
  function pyt(a, b) {
    return Math.sqrt(a * a + b * b);
  }
  function near(d) {
    if (d > 127) return 0;
    if (d < -128) return 0;
    return 1;
  }
  function append(a, b) {
    if (Object.prototype.toString.call(a) != "[object Array]") {
      return [a, b];
    }
    a = a.slice();
    a.push(b);
    return a;
  }
  function lsb(a) {
    return a % 256;
  }
  function msb(a) {
    return a >> 8 & 255;
  }
  function Parser() {
    this.success = false;
    this.errormsg = "";
    this.expression = "";
    this.pos = 0;
    this.tokennumber = 0;
    this.tokenprio = 0;
    this.tokenindex = 0;
    this.tmpprio = 0;
    this.ops1 = {
      //"lsb": function(x){Math.floor(x%256);},
      lsb,
      msb,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sqrt: Math.sqrt,
      log: Math.log,
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      isnear: near,
      "-": neg,
      exp: Math.exp
    };
    this.ops2 = {
      "+": add,
      "-": sub,
      "*": mul,
      "/": div,
      "%": mod,
      "#": mod,
      "^": Math.pow,
      ",": append,
      "=": fbequ,
      "!=": fbnequ,
      "<": fblt,
      ">": fbgt,
      "<=": fble,
      ">=": fbge,
      "&": fand,
      "|": fnebo,
      "||": concat
    };
    this.functions = {
      random,
      fac,
      min: Math.min,
      max: Math.max,
      pyt,
      isnear: near,
      pow: Math.pow,
      atan2: Math.atan2
    };
    this.consts = {
      //"E": Math.E,
      //"PI": Math.PI
    };
  }
  Parser.parse = function(expr) {
    return new Parser().parse(expr);
  };
  Parser.usage = function(expr, variables) {
    return Parser.parse(expr).usage(variables);
  };
  Parser.evaluate = function(expr, variables) {
    return Parser.parse(expr).evaluate(variables);
  };
  Parser.Expression = Expression;
  Parser.values = {
    lsb: function(x) {
      Math.floor(x % 256);
    },
    msb: function(x) {
      Math.floor(x / 256);
    },
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sqrt: Math.sqrt,
    log: Math.log,
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    random,
    fac,
    exp: Math.exp,
    min: Math.min,
    max: Math.max,
    pyt,
    isnear: near,
    pow: Math.pow,
    atan2: Math.atan2,
    E: Math.E,
    PI: Math.PI
  };
  var PRIMARY = 1 << 0;
  var OPERATOR = 1 << 1;
  var FUNCTION = 1 << 2;
  var LPAREN = 1 << 3;
  var RPAREN = 1 << 4;
  var COMMA = 1 << 5;
  var SIGN = 1 << 6;
  var CALL = 1 << 7;
  var NULLARY_CALL = 1 << 8;
  Parser.prototype = {
    parse: function(expr) {
      this.errormsg = "";
      this.success = true;
      let operstack = [];
      let tokenstack = [];
      this.tmpprio = 0;
      let expected = PRIMARY | LPAREN | FUNCTION | SIGN;
      let noperators = 0;
      this.expression = expr;
      this.pos = 0;
      if (!this.expression)
        throw { msg: "Empty expression, probably missing argument" };
      while (this.pos < this.expression.length) {
        if (this.isNumber()) {
          if ((expected & PRIMARY) === 0) {
            this.error_parsing(this.pos, "unexpected number");
          }
          let token = new Token(TNUMBER, 0, 0, this.tokennumber);
          tokenstack.push(token);
          expected = OPERATOR | RPAREN | COMMA;
        } else if (this.isOperator()) {
          if (this.isSign() && expected & SIGN) {
            if (this.isNegativeSign()) {
              this.tokenprio = 2;
              this.tokenindex = "-";
              noperators++;
              this.addfunc(tokenstack, operstack, TOP1);
            }
            expected = PRIMARY | LPAREN | FUNCTION | SIGN;
          } else if (this.isComment()) {
          } else {
            if ((expected & OPERATOR) === 0) {
              this.error_parsing(this.pos, "unexpected operator");
            }
            noperators += 2;
            this.addfunc(tokenstack, operstack, TOP2);
            expected = PRIMARY | LPAREN | FUNCTION | SIGN;
          }
        } else if (this.isString()) {
          if ((expected & PRIMARY) === 0) {
            this.error_parsing(this.pos, "unexpected string");
          }
          let token = new Token(TNUMBER, 0, 0, this.tokennumber);
          tokenstack.push(token);
          expected = OPERATOR | RPAREN | COMMA;
        } else if (this.isLeftParenth()) {
          if ((expected & LPAREN) === 0) {
            this.error_parsing(this.pos, 'unexpected "("');
          }
          if (expected & CALL) {
            noperators += 2;
            this.tokenprio = -2;
            this.tokenindex = -1;
            this.addfunc(tokenstack, operstack, TFUNCALL);
          }
          expected = PRIMARY | LPAREN | FUNCTION | SIGN | NULLARY_CALL;
        } else if (this.isRightParenth()) {
          if (expected & NULLARY_CALL) {
            let token = new Token(TNUMBER, 0, 0, []);
            tokenstack.push(token);
          } else if ((expected & RPAREN) === 0) {
            this.error_parsing(this.pos, 'unexpected ")"');
          }
          expected = OPERATOR | RPAREN | COMMA | LPAREN | CALL;
        } else if (this.isComma()) {
          if ((expected & COMMA) === 0) {
            this.error_parsing(this.pos, 'unexpected ","');
          }
          this.addfunc(tokenstack, operstack, TOP2);
          noperators += 2;
          expected = PRIMARY | LPAREN | FUNCTION | SIGN;
        } else if (this.isConst()) {
          if ((expected & PRIMARY) === 0) {
            this.error_parsing(this.pos, "unexpected constant");
          }
          let consttoken = new Token(TNUMBER, 0, 0, this.tokennumber);
          tokenstack.push(consttoken);
          expected = OPERATOR | RPAREN | COMMA;
        } else if (this.isOp2()) {
          if ((expected & FUNCTION) === 0) {
            this.error_parsing(this.pos, "unexpected function");
          }
          this.addfunc(tokenstack, operstack, TOP2);
          noperators += 2;
          expected = LPAREN;
        } else if (this.isOp1()) {
          if ((expected & FUNCTION) === 0) {
            this.error_parsing(this.pos, "unexpected function");
          }
          this.addfunc(tokenstack, operstack, TOP1);
          noperators++;
          expected = LPAREN;
        } else if (this.isVar()) {
          if ((expected & PRIMARY) === 0) {
            this.error_parsing(this.pos, "unexpected variable");
          }
          let vartoken = new Token(TVAR, this.tokenindex, 0, 0);
          tokenstack.push(vartoken);
          expected = OPERATOR | RPAREN | COMMA | LPAREN | CALL;
        } else if (this.isWhite()) {
        } else {
          if (this.errormsg === "") {
            this.error_parsing(
              this.pos,
              "unknown character in " + this.expression
            );
          } else {
            this.error_parsing(this.pos, this.errormsg);
          }
        }
      }
      if (this.tmpprio < 0 || this.tmpprio >= 10) {
        this.error_parsing(this.pos, 'unmatched "()"');
      }
      while (operstack.length > 0) {
        let tmp = operstack.pop();
        tokenstack.push(tmp);
      }
      if (noperators + 1 !== tokenstack.length) {
        this.error_parsing(this.pos, "parity");
      }
      return new Expression(
        tokenstack,
        object(this.ops1),
        object(this.ops2),
        object(this.functions)
      );
    },
    evaluate: function(expr, variables) {
      let value = this.parse(expr).evaluate(variables);
      return value;
    },
    error_parsing: function(column, msg) {
      this.success = false;
      this.errormsg = "parse error [column " + column + "]: " + msg;
      throw { msg: this.errormsg };
    },
    //\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
    addfunc: function(tokenstack, operstack, type_) {
      let operator = new Token(
        type_,
        this.tokenindex,
        this.tokenprio + this.tmpprio,
        0
      );
      while (operstack.length > 0) {
        if (operator.prio_ <= operstack[operstack.length - 1].prio_) {
          tokenstack.push(operstack.pop());
        } else {
          break;
        }
      }
      operstack.push(operator);
    },
    isNumber: function() {
      let r = false;
      let str = "";
      let firstok = 0;
      let firstcode = 0;
      let base = 10;
      let shouldbehex = false;
      let bakpos = this.pos;
      let strx;
      while (this.pos < this.expression.length) {
        let code = this.expression.charCodeAt(this.pos);
        if (firstok === 0) firstcode = code;
        if (code >= 48 && code <= 57 || code === 46 || firstok === 0 && code === 36 || //$1123
        firstok === 0 && code === 37 || //%11010
        firstok === 1 && code === 88 && firstcode === 48 || //0X
        firstok === 1 && code === 120 && firstcode === 48 || firstok > 0 && code === 72 || //...H
        firstok > 0 && code === 104 || //...h
        firstok > 0 && code === 66 || //...B
        firstok > 0 && code === 98 || //...b
        firstok > 0 && code === 81 || //...Q
        firstok > 0 && code === 113 || //...q
        firstok > 0 && code === 79 || //...O
        firstok > 0 && code === 111 || //...o
        firstok > 0 && code >= 65 && code <= 70 || firstok > 0 && code >= 97 && code <= 102) {
          if ((firstok > 0 && code >= 65 && code <= 70 || firstok > 0 && code >= 97 && code <= 102) && !(base === 16)) {
            shouldbehex = true;
          }
          firstok++;
          str += this.expression.charAt(this.pos);
          this.pos++;
          strx = str;
          if (str[0] === "$") {
            strx = "0x" + str.substr(1);
            base = 16;
          }
          if (str[1] === "x" || str[1] === "X") {
            base = 16;
          }
          if (str[str.length - 1] === "h" || str[str.length - 1] === "H") {
            if (base == 10 || base == 2) {
              strx = "0x" + str.substr(0, str.length - 1);
              base = 16;
            }
          }
          if (str[str.length - 1] === "b" || str[str.length - 1] === "B") {
            if (base == 10) {
              strx = str.substr(0, str.length - 1);
              base = 2;
            }
          }
          if (str[str.length - 1] === "q" || str[str.length - 1] === "Q" || str[str.length - 1] === "o" || str[str.length - 1] === "O") {
            if (base == 10) {
              strx = str.substr(0, str.length - 1);
              base = 8;
            }
          }
          if (base != 10) this.tokennumber = parseInt(strx, base);
          else this.tokennumber = parseFloat(strx);
          r = true;
        } else {
          break;
        }
      }
      if (str[0] === "%") {
        if (str.length < 2) {
          this.pos = bakpos;
          return false;
        }
        strx = str.substr(1);
        this.tokennumber = parseInt(strx, 2);
      }
      if (shouldbehex && base === 2) {
        shouldbehex = false;
      }
      if (shouldbehex && base !== 16) {
        this.pos = bakpos;
        return false;
      }
      if (strx === "0x") {
        this.pos = bakpos;
        return false;
      }
      return r;
    },
    // Ported from the yajjl JSON parser at http://code.google.com/p/yajjl/
    unescape: function(v, pos) {
      let buffer = [];
      let escaping = false;
      for (let i = 0; i < v.length; i++) {
        let c = v.charAt(i);
        if (escaping) {
          switch (c) {
            case "'":
              buffer.push("'");
              break;
            case "\\":
              buffer.push("\\");
              break;
            case "/":
              buffer.push("/");
              break;
            case "b":
              buffer.push("\b");
              break;
            case "f":
              buffer.push("\f");
              break;
            case "n":
              buffer.push("\n");
              break;
            case "r":
              buffer.push("\r");
              break;
            case "t":
              buffer.push("	");
              break;
            case "u":
              let codePoint = parseInt(v.substring(i + 1, i + 5), 16);
              buffer.push(String.fromCharCode(codePoint));
              i += 4;
              break;
            default:
              throw this.error_parsing(
                pos + i,
                "Illegal escape sequence: '\\" + c + "'"
              );
          }
          escaping = false;
        } else {
          if (c == "\\") {
            escaping = true;
          } else {
            buffer.push(c);
          }
        }
      }
      return buffer.join("");
    },
    isString: function() {
      let r = false;
      let str = "";
      let startpos = this.pos;
      if (this.pos < this.expression.length && this.expression.charAt(this.pos) == "'" || this.expression.charAt(this.pos) == '"') {
        let delim = this.expression.charAt(this.pos);
        this.pos++;
        while (this.pos < this.expression.length) {
          let code = this.expression.charAt(this.pos);
          if (code != delim || str.slice(-1) == "\\") {
            str += this.expression.charAt(this.pos);
            this.pos++;
          } else {
            this.pos++;
            this.tokennumber = this.unescape(str, startpos);
            r = true;
            break;
          }
        }
      }
      return r;
    },
    isConst: function() {
      return false;
    },
    isOperator: function() {
      let code = this.expression.charCodeAt(this.pos);
      if (code === 43) {
        this.tokenprio = 0;
        this.tokenindex = "+";
      } else if (code === 45) {
        this.tokenprio = 0;
        this.tokenindex = "-";
      } else if (code === 124) {
        if (this.expression.charCodeAt(this.pos + 1) === 124) {
          this.pos++;
          this.tokenprio = 0;
          this.tokenindex = "||";
        } else {
          this.tokenprio = 5;
          this.tokenindex = "|";
        }
      } else if (code === 42) {
        this.tokenprio = 1;
        this.tokenindex = "*";
      } else if (code === 47) {
        this.tokenprio = 2;
        this.tokenindex = "/";
      } else if (code === 37) {
        this.tokenprio = 2;
        this.tokenindex = "%";
      } else if (code === 35) {
        this.tokenprio = 2;
        this.tokenindex = "#";
      } else if (code === 94) {
        this.tokenprio = 3;
        this.tokenindex = "^";
      } else if (code === 38) {
        this.tokenprio = 4;
        this.tokenindex = "&";
      } else if (code === 61) {
        this.tokenprio = -1;
        this.tokenindex = "=";
      } else if (code === 33) {
        if (this.expression.charCodeAt(this.pos + 1) === 61) {
          this.pos++;
          this.tokenprio = -1;
          this.tokenindex = "!=";
        } else {
          this.tokenprio = 5;
          this.tokenindex = "!";
        }
      } else if (code === 63) {
        if (this.expression.charCodeAt(this.pos + 1) === 60) {
          this.pos++;
          if (this.expression.charCodeAt(this.pos + 1) === 61) {
            this.pos++;
            this.tokenprio = -1;
            this.tokenindex = "<=";
          } else {
            this.tokenprio = -1;
            this.tokenindex = "<";
          }
        }
        if (this.expression.charCodeAt(this.pos + 1) === 62) {
          this.pos++;
          if (this.expression.charCodeAt(this.pos + 1) === 61) {
            this.pos++;
            this.tokenprio = -1;
            this.tokenindex = ">=";
          } else {
            this.tokenprio = -1;
            this.tokenindex = ">";
          }
        }
      } else {
        return false;
      }
      this.pos++;
      return true;
    },
    isSign: function() {
      let code = this.expression.charCodeAt(this.pos - 1);
      if (code === 45 || code === 43) {
        return true;
      }
      return false;
    },
    /*
    isPositiveSign: function () {
      let code = this.expression.charCodeAt(this.pos - 1);
      if (code === 43) {
        // -
        return true;
      }
      return false;
    },
    */
    isNegativeSign: function() {
      let code = this.expression.charCodeAt(this.pos - 1);
      if (code === 45) {
        return true;
      }
      return false;
    },
    isLeftParenth: function() {
      let code = this.expression.charCodeAt(this.pos);
      if (code === 40) {
        this.pos++;
        this.tmpprio += 10;
        return true;
      }
      return false;
    },
    isRightParenth: function() {
      let code = this.expression.charCodeAt(this.pos);
      if (code === 41) {
        this.pos++;
        this.tmpprio -= 10;
        return true;
      }
      return false;
    },
    isComma: function() {
      let code = this.expression.charCodeAt(this.pos);
      if (code === 44) {
        this.pos++;
        this.tokenprio = -1;
        this.tokenindex = ",";
        return true;
      }
      return false;
    },
    isWhite: function() {
      let code = this.expression.charCodeAt(this.pos);
      if (code === 32 || code === 9 || code === 10 || code === 13) {
        this.pos++;
        return true;
      }
      return false;
    },
    isOp1: function() {
      let str = "";
      for (let i = this.pos; i < this.expression.length; i++) {
        let c = this.expression.charAt(i);
        if (c.toUpperCase() === c.toLowerCase()) {
          if (i === this.pos || c != "_" && (c < "0" || c > "9")) {
            break;
          }
        }
        str += c;
      }
      if (str.length > 0 && str in this.ops1) {
        this.tokenindex = str;
        this.tokenprio = 5;
        this.pos += str.length;
        return true;
      }
      return false;
    },
    isOp2: function() {
      let str = "";
      for (let i = this.pos; i < this.expression.length; i++) {
        let c = this.expression.charAt(i);
        if (c.toUpperCase() === c.toLowerCase()) {
          if (i === this.pos || c != "_" && (c < "0" || c > "9")) {
            break;
          }
        }
        str += c;
      }
      if (str.length > 0 && str in this.ops2) {
        this.tokenindex = str;
        this.tokenprio = 5;
        this.pos += str.length;
        return true;
      }
      return false;
    },
    isVar: function() {
      let str = "";
      for (let i = this.pos; i < this.expression.length; i++) {
        let c = this.expression.charAt(i);
        if (c === "$") {
          str = "_PC";
          break;
        }
        if (c.toUpperCase() === c.toLowerCase() && c !== "<" && c !== ">") {
          if (i === this.pos || c != "_" && (c < "0" || c > "9")) {
            break;
          }
        }
        str += c;
      }
      if (str.length > 0) {
        this.tokenindex = str;
        this.tokenprio = 4;
        if (str !== "_PC") {
          this.pos += str.length;
        } else {
          this.pos++;
        }
        return true;
      }
      return false;
    },
    isComment: function() {
      let code = this.expression.charCodeAt(this.pos - 1);
      if (code === 47 && this.expression.charCodeAt(this.pos) === 42) {
        this.pos = this.expression.indexOf("*/", this.pos) + 2;
        if (this.pos === 1) {
          this.pos = this.expression.length;
        }
        return true;
      }
      return false;
    }
  };

  // pass1.js
  var notInModule = (opts) => {
    if (opts.PRAGMAS && opts.PRAGMAS.indexOf("MODULE") > -1) {
      throw { msg: "Not allowed in modules" };
    }
  };
  var pass1 = async (V, vxs, opts) => {
    if (!opts.xref) opts.xref = {};
    let segment = "CSEG";
    let segallow = () => {
      if (segment === "BSSEG") throw { msg: op.opcode + " is not allowed in BSSEG" };
    };
    let seg = {};
    let PC = 0;
    let vars = {};
    if (vxs) vars = vxs;
    let op = null;
    let m, l;
    let ifskip = 0;
    let cond;
    let doif = 0;
    let ifstack = [];
    let blocks = [];
    let phase = 0;
    let DP = 0;
    for (let op2 of V) {
      const origin = { ...op2.origin };
      opts.WLINE = origin;
      op2.pass = 1;
      op2.segment = segment;
      op2.addr = PC;
      op2._dp = DP;
      vars._PC = PC;
      if (phase !== 0) {
        op2.phase = phase;
      }
      if (op2.opcode === "ENDIF") {
        if (!doif) throw {
          msg: "ENDIF without IF",
          s: op2
        };
        ifskip = ifstack.pop();
        if (ifstack.length) {
          doif = 1;
        } else {
          doif = 0;
          ifskip = 0;
        }
        continue;
      }
      if (op2.opcode === "ELSE") {
        if (!doif) throw {
          msg: "ELSE without IF",
          s: op2
        };
        ifskip = ifstack.pop();
        ifskip = ifskip ? 0 : 1;
        if (ifstack.filter((q) => q == 1).length) {
          ifskip = 1;
        }
        ifstack.push(ifskip);
        continue;
      }
      if (op2.opcode === "IF") {
        if (doif) {
        }
        try {
          cond = Parser.evaluate(op2.params[0], vars);
        } catch (e) {
        }
        if (!cond) ifskip = 1;
        doif = 1;
        ifstack.push(ifskip);
        continue;
      }
      if (op2.opcode === "IFN") {
        try {
          cond = Parser.evaluate(op2.params[0], vars);
        } catch (e) {
        }
        if (cond) ifskip = 1;
        doif = 1;
        ifstack.push(ifskip);
        continue;
      }
      if (ifskip) {
        op2.ifskip = true;
        continue;
      }
      if (op2.opcode === ".BLOCK") {
        if (!op2.includedFileAtLine) blocks.push(op2.numline);
        else blocks.push(op2.numline + "@" + op2.includedFileAtLine);
        let prefix = blocks.join("/");
        vars["__" + prefix] = [];
        continue;
      }
      if (op2.opcode === ".ENDBLOCK") {
        let redef = vars["__" + blocks.join("/")];
        for (let nn = 0; nn < redef.length; nn++) {
          vars[redef[nn]] = vars[blocks.join("/") + "/" + redef[nn]];
          delete vars[blocks.join("/") + "/" + redef[nn]];
        }
        blocks.pop();
        vars["__blocks"] = JSON.stringify(blocks);
        continue;
      }
      if (op2.label) {
        let varname = op2.label;
        let beGlobal = false;
        if (varname[0] === "@") {
          beGlobal = true;
          varname = varname.substr(1);
          op2.label = varname;
          op2.beGlobal = true;
        }
        if (op2.beGlobal) beGlobal = true;
        if (blocks.length > 0) {
          varname = blocks.join("/") + "/" + varname;
          vars["__" + blocks.join("/")].push(op2.label);
        }
        if (!vxs) {
          if (typeof vars[varname + "$"] !== "undefined" || beGlobal && vars[op2.label] !== void 0) {
            if (op2.opcode !== ".SET" && op2.opcode !== ":=") {
              throw {
                msg: "Redefine label " + op2.label + " at line " + op2.numline,
                s: op2
              };
            }
          }
        }
        if (vars[op2.label]) {
          vars[varname] = vars[op2.label];
        } else {
          if (beGlobal) {
            vars[varname] = PC;
          }
        }
        opts.xref[op2.label] = {
          defined: {
            line: op2.numline,
            file: op2.includedFile || "*main*"
          },
          value: PC
        };
        vars[varname + "$"] = PC;
        vars[op2.label] = PC;
        if (beGlobal) vars[varname] = PC;
      }
      try {
        if (op2.opcode === ".ORG") {
          if (opts.PRAGMAS && opts.PRAGMAS.indexOf("MODULE") > -1) {
            throw { msg: "ORG is not allowed in modules" };
          }
          PC = Parser.evaluate(op2.params[0], vars);
          op2.addr = PC;
          seg[segment] = PC;
          continue;
        }
        if (op2.opcode === ".EXPORT") {
          if (opts.PRAGMAS && opts.PRAGMAS.indexOf("MODULE") < 0) {
            throw { msg: ".EXPORT is not allowed out of modules" };
          }
          continue;
        }
        if (op2.opcode === ".EXTERN") {
          if (opts.PRAGMAS && opts.PRAGMAS.indexOf("MODULE") < 0) {
            throw { msg: ".EXTERN is not allowed out of modules" };
          }
          let name = op2.params[0];
          if (!name) name = op2.label;
          vars[name.toUpperCase()] = 0;
          continue;
        }
        if (op2.opcode === ".CSEG") {
          seg[segment] = PC;
          segment = "CSEG";
          op2.segment = segment;
          PC = seg[segment] || 0;
          op2.addr = PC;
        }
        if (op2.opcode === ".DSEG") {
          seg[segment] = PC;
          segment = "DSEG";
          op2.segment = segment;
          PC = seg[segment] || 0;
          op2.addr = PC;
        }
        if (op2.opcode === ".ESEG") {
          seg[segment] = PC;
          segment = "ESEG";
          op2.segment = segment;
          PC = seg[segment] || 0;
          op2.addr = PC;
        }
        if (op2.opcode === ".BSSEG") {
          seg[segment] = PC;
          segment = "BSSEG";
          op2.segment = segment;
          PC = seg[segment] || 0;
          op2.addr = PC;
        }
        if (op2.opcode === ".PHASE") {
          notInModule(opts);
          if (phase) throw {
            msg: "PHASE cannot be nested"
          };
          let newphase = Parser.evaluate(op2.params[0], vars);
          op2.addr = PC;
          phase = newphase - PC;
          PC = newphase;
          continue;
        }
        if (op2.opcode === ".DEPHASE") {
          notInModule(opts);
          op2.addr = PC;
          PC = PC - phase;
          phase = 0;
          continue;
        }
        if (op2.opcode === "EQU") {
          try {
            vars[op2.label] = Parser.evaluate(op2.params[0], vars);
          } catch (e) {
            vars[op2.label] = null;
          }
          opts.xref[op2.label] = {
            defined: {
              line: op2.numline,
              file: op2.includedFile || "*main*"
            },
            value: vars[op2.label]
          };
          continue;
        }
        if (op2.opcode === "=" || op2.opcode === ":=" || op2.opcode === ".SET") {
          vars[op2.label] = Parser.evaluate(op2.params[0], vars);
          opts.xref[op2.label] = {
            defined: {
              line: op2.numline,
              file: op2.includedFile || "*main*"
            },
            value: vars[op2.label]
          };
          continue;
        }
      } catch (e) {
        throw {
          msg: e.msg,
          s: op2
        };
      }
      if (op2.opcode === "DB" || op2.opcode === "FCB") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes++;
              continue;
            }
            if (typeof m === "string") {
              op2.bytes += m.length;
              continue;
            }
          } catch (e) {
            op2.bytes++;
          }
        }
      }
      if (op2.opcode === "FCC") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          let mystring = op2.params[l].trim();
          let delim = mystring[0];
          if (mystring[mystring.length - 1] !== delim)
            throw {
              msg: "Delimiters does not match",
              s: op2
            };
          op2.bytes += mystring.length - 2;
        }
      }
      if (op2.opcode === ".CSTR" || op2.opcode === ".PSTR" || op2.opcode === ".ISTR") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes++;
              continue;
            }
            if (typeof m === "string") {
              op2.bytes += m.length;
              continue;
            }
          } catch (e) {
            op2.bytes++;
          }
        }
        if (op2.opcode === ".CSTR" || op2.opcode === ".PSTR") op2.bytes++;
      }
      if (op2.opcode === "DS" || op2.opcode === "RMB") {
        let bytes = Parser.evaluate(op2.params[0], vars);
        op2.bytes = bytes;
        if (typeof bytes !== "number")
          throw {
            msg: "DS / RMB needs a numerical parameter",
            s: op2
          };
        if (op2.params.length == 2) {
          let m2 = Parser.evaluate(op2.params[1], vars);
          if (typeof m2 === "string") m2 = m2.charCodeAt(0);
          op2.bytes = bytes;
          op2.lens = [];
          for (let iq = 0; iq < bytes; iq++) {
            op2.lens[iq] = m2;
          }
        }
        PC = PC + bytes;
        continue;
      }
      if (op2.opcode === "ALIGN") {
        notInModule(opts);
        let align = Parser.evaluate(op2.params[0], vars);
        PC = PC + (PC % align > 0 ? align - PC % align : 0);
        continue;
      }
      if (op2.opcode === "SETDP") {
        DP = Parser.evaluate(op2.params[0], vars);
        continue;
      }
      if (op2.opcode === "FILL") {
        segallow();
        let bytes = Parser.evaluate(op2.params[1], vars);
        if (typeof bytes === "string") bytes = bytes.charCodeAt(0);
        let m2 = Parser.evaluate(op2.params[0], vars);
        if (typeof m2 === "string") m2 = m2.charCodeAt(0);
        op2.bytes = bytes;
        op2.lens = [];
        for (let iq = 0; iq < bytes; iq++) {
          op2.lens[iq] = m2;
        }
        PC = PC + bytes;
        continue;
      }
      if (op2.opcode === "BSZ" || op2.opcode === "ZMB") {
        segallow();
        let bytes = Parser.evaluate(op2.params[0], vars);
        op2.bytes = bytes;
        op2.lens = [];
        for (let iq = 0; iq < bytes; iq++) {
          op2.lens[iq] = 0;
        }
        PC = PC + bytes;
        continue;
      }
      if (op2.opcode === "DW" || op2.opcode === "FDB") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes += 2;
              continue;
            }
          } catch (e) {
            op2.bytes += 2;
          }
        }
      }
      if (op2.opcode === "DD" || op2.opcode === "DF") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes += 4;
              continue;
            }
          } catch (e) {
            op2.bytes += 4;
          }
        }
      }
      if (op2.opcode === "DFF") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes += 8;
              continue;
            }
          } catch (e) {
            op2.bytes += 8;
          }
        }
      }
      if (op2.opcode === "DFZXS") {
        segallow();
        op2.bytes = 0;
        for (l = 0; l < op2.params.length; l++) {
          try {
            m = Parser.evaluate(op2.params[l], vars);
            if (typeof m === "number") {
              op2.bytes += 5;
              continue;
            }
          } catch (e) {
            op2.bytes += 5;
          }
        }
      }
      if (op2.opcode === ".INCBIN") {
        segallow();
        if (!op2.params[0])
          throw {
            msg: "No file name given at line " + op2.numline,
            s: op2
          };
        let nf = await opts.readFile(op2.params[0], true);
        if (!nf)
          throw {
            msg: "Cannot find file " + op2.params[0] + " for incbin",
            s: op2
          };
        op2.bytes = 0;
        op2.lens = [];
        for (let iq = 0; iq < nf.length; iq++) {
          let cd = nf.charCodeAt(iq);
          if (cd > 255) {
            op2.lens[op2.bytes++] = cd >> 8;
          }
          op2.lens[op2.bytes++] = cd % 256;
        }
        PC = PC + op2.bytes;
        continue;
      }
      if (op2.opcode === ".M16") {
        vars.__AX = 16;
        continue;
      }
      if (op2.opcode === ".M8") {
        vars.__AX = 8;
        continue;
      }
      if (op2.opcode === ".X16") {
        vars.__MX = 16;
        continue;
      }
      if (op2.opcode === ".X8") {
        vars.__MX = 8;
        continue;
      }
      let opa = opts.assembler.parseOpcode(origin, vars, Parser);
      if (opa) {
        segallow();
        op2 = opa;
      }
      if (op2.bytes === void 0) op2.bytes = 0;
      PC += op2.bytes;
      if (op2.params && op2.params.length && !op2.opcode) {
        throw {
          msg: "No opcode, possible missing",
          s: op2
        };
      }
    }
    return [V, vars];
  };

  // utils/fp.js
  var fptozx = (num, simpleint) => {
    simpleint = simpleint === void 0 ? true : simpleint;
    let sgn = num < 0;
    let m = sgn ? -num : num;
    if (simpleint && num == Math.floor(num) && num >= -65535 && num <= 65535) {
      m = sgn ? 65536 + num : num;
      return [0, sgn ? 255 : 0, m & 255, m >> 8 & 255, 0];
    }
    let bit32 = function(m2, sgn2) {
      let out = "";
      let a = [];
      for (let i2 = 0; i2 < 32; i2++) {
        let bit = "0";
        m2 = m2 * 2;
        if (m2 >= 1) {
          m2 -= 1;
          bit = "1";
        }
        if (sgn2 && i2 === 0) bit = "1";
        if (!sgn2 && i2 === 0) bit = "0";
        out += bit;
        if (i2 % 8 == 7) {
          a.push(parseInt(out, 2));
          out = "";
        }
      }
      return a;
    };
    let e = Math.floor(Math.log2(m) + 1);
    if (e > 127) throw new Error("Overflow");
    if (e < -127) return [0, 0, 0, 0, 0];
    let i;
    if (e < 0) {
      for (i = 0; i < -e; i++) m = m * 2;
    } else {
      for (i = 0; i < e; i++) m = m / 2;
    }
    let n = bit32(m, sgn);
    return [e + 128, n[0], n[1], n[2], n[3]];
  };

  // pass2.js
  var pass2 = (vx, opts) => {
    const charVar8 = (dta2) => {
      if (opts.PRAGMAS.RELAX) {
        if (typeof dta2 == "string") {
          return dta2.charCodeAt(0) & 255;
        } else {
          return dta2 & 255;
        }
      } else {
        if (typeof dta2 == "string") {
          if (dta2.length != 1) throw { msg: "String parameter too long (" + dta2 + ")" };
          return dta2.charCodeAt(0) & 255;
        } else {
          if (dta2 > 255) throw { msg: "Param out of bound (" + dta2 + ")" };
          if (dta2 < -128) throw { msg: "Param out of bound (" + dta2 + ")" };
          return dta2 & 255;
        }
      }
    };
    let V = vx[0];
    let vars = vx[1];
    let op = null, dta = null, m, bts, l;
    let blocks = [];
    let ifskip = 0;
    let cond;
    let doif = 0;
    for (let i = 0, j = V.length; i < j; i++) {
      try {
        op = V[i];
        op.pass = 2;
        if (op.opcode === "ENDIF") {
          ifskip = 0;
          continue;
        }
        if (op.opcode === "ELSE") {
          ifskip = ifskip ? 0 : 1;
          continue;
        }
        if (ifskip) {
          continue;
        }
        if (op.opcode === ".ERROR") {
          throw {
            msg: op.paramstring,
            s: op
          };
        }
        if (op.opcode === "IF") {
          try {
            cond = Parser.evaluate(op.params[0], vars);
            if (!cond) ifskip = 1;
          } catch (e) {
            throw {
              msg: "IF condition mismatched"
            };
            ifskip = 1;
          }
          continue;
        }
        if (op.opcode === "IFN") {
          try {
            cond = Parser.evaluate(op.params[0], vars);
            if (cond) ifskip = 1;
          } catch (e) {
            throw {
              msg: "IF condition mismatched"
            };
          }
          continue;
        }
        vars._PC = op.addr;
        for (const param of op.params || []) {
          try {
            let usage = Parser.usage(param.toUpperCase(), vars);
            if (usage.length > 0) op.usage = usage;
            for (let varname of usage) {
              if (!opts.xref[varname].usage) opts.xref[varname].usage = [];
              opts.xref[varname].usage.push({
                line: op.numline,
                file: op.includedFile || "*main*"
              });
            }
          } catch (e) {
            ;
          }
        }
        if (op.opcode === ".BLOCK") {
          if (!op.includedFileAtLine) blocks.push(op.numline);
          else blocks.push(op.numline + "@" + op.includedFileAtLine);
          let redef = vars["__" + blocks.join("/")];
          for (let varname of redef) {
            vars[blocks.join("/") + "/" + varname] = vars[varname];
            vars[varname] = vars[blocks.join("/") + "/" + varname + "$"];
          }
          continue;
        }
        if (op.opcode === ".ENDBLOCK") {
          let redef = vars["__" + blocks.join("/")];
          for (let varname of redef) {
            vars[varname] = vars[blocks.join("/") + "/" + varname];
            if (vars[varname] === void 0) delete vars[varname];
            vars[blocks.join("/") + "/" + varname] = null;
          }
          blocks.pop();
          continue;
        }
        if (op.opcode === ".ENT") {
          opts.ENT = Parser.evaluate(op.params[0], vars);
          continue;
        }
        if (op.opcode === ".BINFROM") {
          opts.BINFROM = Parser.evaluate(op.params[0], vars);
          continue;
        }
        if (op.opcode === ".BINTO") {
          opts.BINTO = Parser.evaluate(op.params[0], vars);
          continue;
        }
        if (op.opcode === ".ENGINE") {
          opts.ENGINE = op.params[0];
          continue;
        }
        if (op.opcode === "EQU") {
          if (!op.label) throw {
            msg: "EQU without label",
            s: op
          };
          vars[op.label] = Parser.evaluate(op.params[0], vars);
          continue;
        }
        if (op.opcode === ".SET" || op.opcode === ":=") {
          vars[op.label] = Parser.evaluate(op.params[0], vars);
          continue;
        }
        if (op.opcode === "DB" || op.opcode === "FCB") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              op.lens[bts++] = Math.floor(m % 256);
              continue;
            }
            if (typeof m === "string") {
              for (let mm = 0; mm < m.length; mm++) {
                op.lens[bts++] = m.charCodeAt(mm);
              }
              continue;
            }
          }
          continue;
        }
        if (op.opcode === "FCC") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            let mystring = param.trim();
            let delim = mystring[0];
            let m2 = mystring.substr(1, mystring.length - 2);
            for (let mm = 0; mm < m2.length; mm++) {
              op.lens[bts++] = m2.charCodeAt(mm);
            }
          }
          continue;
        }
        if (op.opcode === ".CSTR") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              op.lens[bts++] = Math.floor(m % 256);
              continue;
            }
            if (typeof m === "string") {
              for (let mm = 0; mm < m.length; mm++) {
                op.lens[bts++] = m.charCodeAt(mm);
              }
              continue;
            }
          }
          op.lens[bts++] = 0;
          continue;
        }
        if (op.opcode === ".PSTR") {
          bts = 1;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              op.lens[bts++] = Math.floor(m % 256);
              continue;
            }
            if (typeof m === "string") {
              for (let mm = 0; mm < m.length; mm++) {
                op.lens[bts++] = m.charCodeAt(mm);
              }
              continue;
            }
          }
          op.lens[0] = bts - 1;
          continue;
        }
        if (op.opcode === ".ISTR") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              op.lens[bts++] = Math.floor(m % 128);
              continue;
            }
            if (typeof m === "string") {
              for (let mm = 0; mm < m.length; mm++) {
                op.lens[bts++] = m.charCodeAt(mm) & 127;
              }
              continue;
            }
          }
          op.lens[bts - 1] = op.lens[bts - 1] | 128;
          continue;
        }
        if (op.opcode === "DW" || op.opcode === "FDB") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              if (opts.endian) {
                op.lens[bts++] = Math.floor(m / 256);
                op.lens[bts++] = Math.floor(m % 256);
              } else {
                op.lens[bts++] = Math.floor(m % 256);
                op.lens[bts++] = Math.floor(m / 256);
              }
              continue;
            }
          }
          continue;
        }
        if (op.opcode === "DD") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              let b = new ArrayBuffer(4);
              let c = new Int32Array(b);
              c[0] = m;
              let a = new Uint8Array(b);
              if (opts.endian) {
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[0];
              } else {
                op.lens[bts++] = a[0];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[3];
              }
              continue;
            }
          }
          continue;
        }
        if (op.opcode === "DF") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              let b = new ArrayBuffer(4);
              let c = new Float32Array(b);
              c[0] = m;
              let a = new Uint8Array(b);
              if (opts.endian) {
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[0];
              } else {
                op.lens[bts++] = a[0];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[3];
              }
              continue;
            }
          }
          continue;
        }
        if (op.opcode === "DFF") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              let b = new ArrayBuffer(8);
              let c = new Float64Array(b);
              c[0] = m;
              let a = new Uint8Array(b);
              if (opts.endian) {
                op.lens[bts++] = a[7];
                op.lens[bts++] = a[6];
                op.lens[bts++] = a[5];
                op.lens[bts++] = a[4];
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[0];
              } else {
                op.lens[bts++] = a[0];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[4];
                op.lens[bts++] = a[5];
                op.lens[bts++] = a[6];
                op.lens[bts++] = a[7];
              }
              continue;
            }
          }
          continue;
        }
        if (op.opcode === "DFZXS") {
          bts = 0;
          op.lens = [];
          for (let param of op.params) {
            m = Parser.evaluate(param, vars);
            if (typeof m === "number") {
              let a = fptozx(m, false);
              if (opts.endian) {
                op.lens[bts++] = a[4];
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[0];
              } else {
                op.lens[bts++] = a[0];
                op.lens[bts++] = a[1];
                op.lens[bts++] = a[2];
                op.lens[bts++] = a[3];
                op.lens[bts++] = a[4];
              }
              continue;
            }
          }
          continue;
        }
        if (op.anonymousLabel) {
          vars["ANON_PREV_2"] = ["ANON_PREV_1"];
          vars["ANON_PREV_1"] = op.addr;
        }
        if (op.lens && op.lens[1] && typeof op.lens[1] === "function") {
          if (op.lens[2] === "addr24") {
            dta = op.lens[1](vars);
            if (opts.endian) {
              op.lens[3] = Math.floor(dta % 256);
              op.lens[2] = Math.floor((dta >> 8) % 256);
              op.lens[1] = Math.floor(dta >> 16 & 255);
            } else {
              op.lens[1] = Math.floor(dta % 256);
              op.lens[2] = Math.floor((dta >> 8) % 256);
              op.lens[3] = Math.floor(dta >> 16 & 255);
            }
          } else if (op.lens[2] === "addr32") {
            dta = op.lens[1](vars);
            if (opts.endian) {
              op.lens[4] = Math.floor(dta % 256);
              op.lens[3] = Math.floor((dta >> 8) % 256);
              op.lens[2] = Math.floor(dta >> 16 & 255);
              op.lens[1] = Math.floor(dta >> 24 & 255);
            } else {
              op.lens[1] = Math.floor(dta % 256);
              op.lens[2] = Math.floor((dta >> 8) % 256);
              op.lens[3] = Math.floor(dta >> 16 & 255);
              op.lens[4] = Math.floor(dta >> 24 & 255);
            }
          } else if (op.lens[2] === null) {
            dta = op.lens[1](vars);
            if (typeof dta == "string") {
              if (opts.endian) {
                op.lens[1] = dta.charCodeAt(0) & 255;
                op.lens[2] = dta.charCodeAt(1) & 255;
              } else {
                op.lens[2] = dta.charCodeAt(0) & 255;
                op.lens[1] = dta.charCodeAt(1) & 255;
              }
            } else {
              if (opts.endian) {
                op.lens[2] = Math.floor(dta % 256);
                op.lens[1] = Math.floor(dta / 256);
              } else {
                op.lens[1] = Math.floor(dta % 256);
                op.lens[2] = Math.floor(dta / 256);
              }
            }
          } else {
            dta = op.lens[1](vars);
            op.lens[1] = charVar8(dta);
          }
        }
        if (op.lens && op.lens.length > 2 && typeof op.lens[2] == "function") {
          dta = op.lens[2](vars);
          if (op.lens[3] === null) {
            dta = op.lens[2](vars);
            if (typeof dta == "string") {
              if (opts.endian) {
                op.lens[2] = dta.charCodeAt(0) & 255;
                op.lens[3] = dta.charCodeAt(1) & 255;
              } else {
                op.lens[3] = dta.charCodeAt(0) & 255;
                op.lens[2] = dta.charCodeAt(1) & 255;
              }
            } else {
              if (opts.endian) {
                op.lens[3] = dta & 255;
                op.lens[2] = dta >> 8;
              } else {
                op.lens[2] = dta & 255;
                op.lens[3] = dta >> 8;
              }
            }
          } else {
            op.lens[2] = charVar8(dta);
          }
        }
        if (op.lens && op.lens.length > 3 && typeof op.lens[3] == "function") {
          dta = op.lens[3](vars);
          if (op.lens[4] === null) {
            dta = op.lens[3](vars);
            if (typeof dta == "string") {
              if (opts.endian) {
                op.lens[3] = dta.charCodeAt(0) & 255;
                op.lens[4] = dta.charCodeAt(1) & 255;
              } else {
                op.lens[4] = dta.charCodeAt(0) & 255;
                op.lens[3] = dta.charCodeAt(1) & 255;
              }
            } else {
              if (opts.endian) {
                op.lens[4] = dta & 255;
                op.lens[3] = dta >> 8;
              } else {
                op.lens[3] = dta & 255;
                op.lens[4] = dta >> 8;
              }
            }
          } else {
            op.lens[3] = charVar8(dta);
          }
        }
        if (op.lens && op.lens.length > 1) {
          if (typeof op.lens[1] == "string") {
            op.lens[1] = op.lens[1].charCodeAt(0);
          }
          if (isNaN(op.lens[1])) {
            throw {
              msg: "param out of bounds, NaN"
            };
          }
          if ((op.lens[1] > 255 || op.lens[1] < -128) && op.lens.length == 2) {
            throw {
              msg: "param out of bounds - " + op.lens[1]
            };
          }
          if (op.lens[1] < 0) {
            op.lens[1] = 256 + op.lens[1];
          }
        }
      } catch (e) {
        throw {
          msg: e.msg,
          s: op,
          e
        };
      }
    }
    return [V, vars];
  };

  // objcode.js
  var get16 = (s, endian = false) => {
    let a = s.lens[s.wia];
    let b = s.lens[s.wia + 1];
    if (endian) {
      return a << 8 | b;
    } else {
      return b << 8 | a;
    }
  };
  var put16 = (s, v, endian = false) => {
    let a = v & 255;
    let b = v >> 8 & 255;
    if (endian) {
      s.lens[s.wia] = b;
      s.lens[s.wia + 1] = a;
    } else {
      s.lens[s.wia] = a;
      s.lens[s.wia + 1] = b;
    }
  };
  var objCode = (V, vars, opts, moduleName = "noname") => {
    let out = [];
    let externs = [];
    let used = [];
    let exports = {};
    let varsSegs = {};
    for (let ln of V) {
      if (ln.label) {
        varsSegs[ln.label.toUpperCase()] = ln.segment;
      }
    }
    let seglen = {
      CSEG: 0,
      // Code segment
      DSEG: 0,
      // Data segment  
      ESEG: 0,
      // Extra segment
      BSSEG: 0
      // BSS (uninitialized data) segment
    };
    let lastOne = null;
    for (let ln of V) {
      if (!ln.opcode) {
        continue;
      }
      if (ln.ifskip) {
        continue;
      }
      let op = {
        lens: ln.lens,
        // Generated machine code bytes
        segment: ln.segment
        // Segment where instruction resides
      };
      let opcode = ln.opcode;
      if (opcode == ".EXTERN") {
        let name = ln.params[0];
        if (!name) name = ln.label;
        externs.push(name.toUpperCase());
      }
      if (opcode == ".EXPORT") {
        let name = ln.params[0];
        name = name.toUpperCase();
        exports[name] = { addr: vars[name], seg: varsSegs[name] };
      }
      if (ln.segment == "BSSEG") {
        seglen.BSSEG += ln.bytes;
        continue;
      }
      if (!ln.lens || !ln.lens.length) continue;
      seglen[ln.segment] += ln.lens.length;
      if (ln.usage && ln.usage.length) {
        let usage = ln.usage;
        for (let u of usage) {
          if (externs.indexOf(u) < 0) {
            op.rel = true;
            op.relseg = varsSegs[u];
          } else {
            op.ext = u;
            used.push(u);
          }
        }
        op.add = get16(ln, opts.endian);
        op.wia = ln.wia;
      }
      if (typeof op.rel == "undefined" && typeof op.ext == "undefined" && lastOne && lastOne.segment == op.segment) {
        lastOne.lens = lastOne.lens.concat(op.lens);
        continue;
      }
      out.push(op);
      if (typeof op.rel == "undefined" && typeof op.ext == "undefined") {
        lastOne = op;
      } else {
        lastOne = null;
      }
    }
    return {
      code: out,
      // Generated object code instructions
      externs: used,
      // External symbols referenced
      exports,
      // Symbols exported by this module
      cpu: opts.assembler.cpu,
      // Target CPU architecture
      endian: opts.assembler.endian,
      // Byte order for multi-byte values
      name: moduleName,
      // Module identifier
      seglen
      // Length of each segment
    };
  };
  var findInLibrary = (name, library) => {
    for (let i = 0; i < library.length; i++) {
      let mod2 = library[i];
      let exports = Object.keys(mod2.exports);
      if (exports.indexOf(name) >= 0) {
        return mod2;
      }
    }
    return null;
  };
  var addModule = (mod2, st, out) => {
    let cbase = st.caddr;
    let dbase = st.daddr;
    let ebase = st.eaddr;
    let bsbase = st.bsaddr;
    for (let k in mod2.exports) {
      let v = mod2.exports[k];
      if (typeof st.resolves[k] == "undefined") {
        throw { msg: "Variable " + k + " is not resolved" };
      }
      if (v.seg == "CSEG") v.addr += st.caddr;
      else if (v.seg == "DSEG") v.addr += st.daddr;
      else if (v.seg == "ESEG") v.addr += st.eaddr;
      else if (v.seg == "BSSEG") v.addr += st.bsaddr;
      st.resolves[k] = v;
      st.notresolved = st.notresolved.filter((item) => item !== k);
    }
    for (let s of mod2.code) {
      let addr = st.caddr;
      if (s.segment == "DSEG") addr = st.daddr;
      else if (s.segment == "ESEG") addr = st.eaddr;
      else if (s.segment == "BSSEG") addr = st.bsaddr;
      s.addr = addr;
      addr += s.lens.length;
      if (s.segment == "CSEG") st.caddr = addr;
      else if (s.segment == "DSEG") st.daddr = addr;
      else if (s.segment == "ESEG") st.eaddr = addr;
      else if (s.segment == "BSSEG") st.bsaddr = addr;
      if (s.rel) {
        if (s.relseg == "CSEG") s.base = cbase;
        else if (s.relseg == "DSEG") s.base = dbase;
        else if (s.relseg == "ESEG") s.base = ebase;
        else if (s.relseg == "BSSEG") s.base = bsbase;
      }
      out.push(s);
    }
    return st;
  };
  var linkModules = (data, modules, library) => {
    let entrypoint = data.entrypoint ? data.entrypoint.toUpperCase() : "_MAIN";
    let out = [];
    let resolves = {};
    let notresolved = [];
    for (let v in data.vars) {
      let val = parseInt(data.vars[v]);
      resolves[v] = { addr: val, seg: null };
    }
    const resolveModule = (mod2) => {
      for (let k of mod2.externs) {
        if (resolves[k]) {
          continue;
        }
        if (notresolved.indexOf(k) < 0) {
          notresolved.push(k);
        }
      }
      for (let k in mod2.exports) {
        if (resolves[k]) {
          throw { msg: "Variable " + k + " is already defined" };
        }
        resolves[k] = mod2.exports[k];
        notresolved = notresolved.filter((item) => item !== k);
      }
    };
    for (let mod2 of modules) {
      for (let k in mod2.exports) {
        resolveModule(mod2);
      }
    }
    while (notresolved.length) {
      let name = notresolved.pop();
      let mod2 = findInLibrary(name, library);
      if (mod2) {
        resolveModule(mod2);
        modules.push(mod2);
      } else {
        throw { msg: "PASS1 Unresolved external " + name };
      }
    }
    let seglen = {
      CSEG: 0,
      DSEG: 0,
      ESEG: 0,
      BSSEG: 0
    };
    for (let mod2 of modules) {
      for (let s in mod2.seglen) {
        seglen[s] += mod2.seglen[s];
      }
    }
    let CSEG = data.segments.CSEG ? parseInt(data.segments.CSEG) : 0;
    let DSEG = data.segments.DSEG ? parseInt(data.segments.DSEG) : CSEG + seglen.CSEG;
    let ESEG = data.segments.ESEG ? parseInt(data.segments.ESEG) : DSEG + seglen.DSEG;
    let BSSEG = data.segments.BSSEG ? parseInt(data.segments.BSSEG) : ESEG + seglen.ESEG;
    let caddr = CSEG;
    let daddr = DSEG;
    let eaddr = ESEG;
    let bsaddr = BSSEG;
    let state = { caddr, daddr, eaddr, bsaddr, resolves, notresolved, library };
    for (let mod2 of modules) {
      state = addModule(mod2, state, out);
    }
    for (let s of out) {
      if (s.ext) {
        if (resolves[s.ext]) {
          s.resolved = resolves[s.ext].addr;
        } else {
          throw { msg: "Unresolved external " + s.ext };
        }
      }
    }
    for (let s of out) {
      if (s.rel) {
        let base = s.base;
        put16(s, s.add + base, data.endian);
      }
    }
    for (let s of out) {
      if (s.resolved) {
        let base = s.resolved;
        put16(s, s.add + base, data.endian);
      }
    }
    for (let s of out) {
      delete s.rel;
      delete s.relseg;
      delete s.ext;
      delete s.add;
      delete s.wia;
      delete s.base;
      delete s.resolved;
    }
    out.sort((a, b) => a.addr - b.addr);
    return {
      //notresolved, 
      CSEG,
      DSEG,
      ESEG,
      BSSEG,
      seglen,
      entry: resolves[entrypoint],
      dump: out
    };
  };

  // utils/base64escaped.js
  var btoax = (str) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return btoa(String.fromCharCode(...bytes));
  };
  var atobx = (str) => {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  };

  // parseLine.js
  var includedLineNumber = (s) => {
    if (!s.includedFile) return s.numline;
    return s.includedFileAtLine + "__" + s.numline;
  };
  var parseLine = (s, macros, opts = { stopFlag: null, olds: null, assembler: null }) => {
    let t = s.line;
    let ll;
    ll = t.match(/^\s*:\s*(.*)/);
    if (ll) {
      s.anonymousLabel = "anon__" + includedLineNumber(s);
      t = ll[1];
    }
    ll = t.match(/^\s*(\@{0,1}[a-zA-Z0-9-_]+):\s*(.*)/);
    if (ll) {
      s.label = ll[1].toUpperCase();
      t = ll[2];
    }
    ll = t.match(/^\s*:\s*(.*)/);
    if (ll) {
      s.label = "__@anon" + s.numline;
      t = ll[2];
    }
    s._dp = 0;
    s.params = [];
    let oo = t.match(/^\s*(\=)\s*(.*)/);
    if (oo) {
      s.opcode = oo[1].toUpperCase();
      t = oo[2];
    } else {
      oo = t.match(/^\s*([\.a-zA-Z0-9-_]+)\s*(.*)/);
      if (oo) {
        s.opcode = oo[1].toUpperCase();
        t = oo[2];
      }
    }
    if (t) {
      while (t.match(/\"(.*?)\"/g)) {
        t = t.replace(/\"(.*?)\"/g, (n) => "00ss" + btoax(n) + "!");
      }
      while (t.match(/\'(.*?)\'/g)) {
        t = t.replace(/\'(.*?)\'/g, (n) => "00ss" + btoax('"' + n.substr(1, n.length - 2) + '"') + "!");
      }
      while (t.match(/\{(.*?)\}/g)) {
        t = t.replace(/\{(.*?)\}/g, (n) => "00bb" + btoax(n.substr(1, n.length - 2)));
      }
      while (t.match(/"(.*?);(.*?)"/g)) {
        t = t.replace(/"(.*?);(.*?)"/g, '"$1\xA7$2"');
      }
      while (t.match(/'(.*?);(.*?)'/g)) {
        t = t.replace(/'(.*?);(.*?)'/g, '"$1\xA7$2"');
      }
      let pp = t.match(/^\s*([^;]*)(.*)/);
      if (pp && pp[1].length) {
        s.paramstring = pp[1];
        let ppc = pp[1];
        while (ppc.match(/"(.*?),(.*?)"/g)) {
          ppc = ppc.replace(/"(.*?),(.*?)"/g, '"$1\u20AC$2"');
        }
        while (ppc.match(/'(.*?),(.*?)'/g)) {
          ppc = ppc.replace(/'(.*?),(.*?)'/g, '"$1\u20AC$2"');
        }
        let n = ppc.match(/([0-9]+)\s*DUP\s*\((.*)\)/i);
        if (n) {
          let dup = parseInt(n[1]);
          let nln = "";
          for (let i = 0; i < dup; i++) {
            nln += n[2] + ",";
          }
          ppc = nln.substring(0, nln.length - 1);
        }
        let px = ppc.split(/\s*,\s*/);
        s.params = px.map((ppc2) => {
          let p = ppc2.replace(/€/g, ",").replace(/§/g, ";").trim();
          p = p.replace(/00ss(.*?)\!/g, (n2) => atobx(n2.substr(4, n2.length - 5)));
          return p;
        });
        t = pp[2].replace(/§/g, ";");
      }
    }
    if (t) {
      let rr = t.match(/^\s*;*(.*)/);
      if (rr) {
        s.remark = rr[1].replace(/00ss(.*?)\!/g, (n) => atobx(n.substr(4, n.length - 5)));
        if (!s.remark) {
          s.remark = " ";
        }
        t = "";
      }
    }
    s.notparsed = t;
    if (s.opcode === "ORG") {
      s.opcode = ".ORG";
    }
    if (s.opcode === ".ERROR") {
      s.paramstring = s.paramstring.replace(/00ss(.*?)\!/g, (n) => atobx(n.substr(4, n.length - 5)));
      return s;
    }
    if (s.opcode === ".EQU") {
      s.opcode = "EQU";
    }
    if (s.opcode === ".FILL") {
      s.opcode = "FILL";
    }
    if (s.opcode === ".ORG") {
      return s;
    }
    if (s.opcode === "DEFB") {
      s.opcode = "DB";
      return s;
    }
    if (s.opcode === ".BYTE") {
      s.opcode = "DB";
      return s;
    }
    if (s.opcode === ".DB") {
      s.opcode = "DB";
      return s;
    }
    if (s.opcode === ".WORD") {
      s.opcode = "DW";
      return s;
    }
    if (s.opcode === ".DW") {
      s.opcode = "DW";
      return s;
    }
    if (s.opcode === "DEFW") {
      s.opcode = "DW";
      return s;
    }
    if (s.opcode === ".DD") {
      s.opcode = "DD";
      return s;
    }
    if (s.opcode === ".DF") {
      s.opcode = "DF";
      return s;
    }
    if (s.opcode === ".DFZXS") {
      s.opcode = "DFZXS";
      return s;
    }
    if (s.opcode === ".DFF") {
      s.opcode = "DFF";
      return s;
    }
    if (s.opcode === "DEFS") {
      s.opcode = "DS";
      return s;
    }
    if (s.opcode === ".RES") {
      s.opcode = "DS";
      return s;
    }
    if (s.opcode === "DEFM") {
      s.opcode = "DS";
      return s;
    }
    if (s.opcode === ".ALIGN") {
      s.opcode = "ALIGN";
      return s;
    }
    if (s.opcode === ".IFN") {
      s.opcode = "IFN";
      return s;
    }
    if (s.opcode === ".IF") {
      s.opcode = "IF";
      return s;
    }
    if (s.opcode === ".ELSE") {
      s.opcode = "ELSE";
      return s;
    }
    if (s.opcode === ".ENDIF") {
      s.opcode = "ENDIF";
      return s;
    }
    if (s.opcode === ".PRAGMA") {
      opts.PRAGMAS = opts.PRAGMAS || [];
      opts.PRAGMAS.push(s.params[0].toUpperCase());
      return s;
    }
    if (s.opcode === "EQU" || s.opcode === "=" || s.opcode === ".SET" || s.opcode === "IF" || s.opcode === "IFN" || s.opcode === "ELSE" || s.opcode === "ENDIF" || s.opcode === ".ERROR" || s.opcode === ".INCLUDE" || s.opcode === ".INCBIN" || s.opcode === ".MACRO" || s.opcode === ".ENDM" || s.opcode === ".BLOCK" || s.opcode === ".ENDBLOCK" || s.opcode === ".REPT" || s.opcode === ".CPU" || s.opcode === ".ENT" || s.opcode === ".BINFROM" || s.opcode === ".BINTO" || s.opcode === ".ENGINE" || s.opcode === ".PRAGMA" || s.opcode === "END" || s.opcode === ".END" || //6809 assembler ops
    s.opcode === "BSZ" || s.opcode === "FCB" || s.opcode === "FCC" || s.opcode === "FDB" || s.opcode === "FILL" || s.opcode === "RMB" || s.opcode === "ZMB" || s.opcode === "SETDP" || //65816
    s.opcode === ".M8" || s.opcode === ".X8" || s.opcode === ".M16" || s.opcode === ".X16" || //phase, dephase
    s.opcode === ".PHASE" || s.opcode === ".DEPHASE" || s.opcode === ".SETPHASE" || s.opcode === "ALIGN" || s.opcode === ".CSTR" || s.opcode === ".ISTR" || s.opcode === ".PSTR" || //segments
    s.opcode === ".CSEG" || s.opcode === ".DSEG" || s.opcode === ".ESEG" || s.opcode === ".BSSEG" || //modules
    s.opcode === ".EXPORT" || s.opcode === ".EXTERN" || s.opcode === "DB" || s.opcode === "DW" || s.opcode === "DD" || s.opcode === "DF" || s.opcode === "DFF" || s.opcode === "DFZXS" || s.opcode === "DS") {
      return s;
    }
    if (s.opcode === ".DEBUGINFO" || s.opcode === ".MACPACK" || s.opcode === ".FEATURE" || s.opcode === ".ZEROPAGE" || s.opcode === ".SEGMENT" || s.opcode === ".SETCPU") {
      s.opcode = "";
      return s;
    }
    if (!s.opcode && s.label) {
      return s;
    }
    let ax = null;
    try {
      ax = opts.assembler.parseOpcode(s, {}, Parser);
    } catch (e) {
      throw {
        msg: e,
        s
      };
    }
    if (ax !== null) return ax;
    if (macros[s.opcode]) {
      s.macro = s.opcode;
      return s;
    }
    if (!s.label && !opts.stopFlag) {
      let s2 = JSON.parse(JSON.stringify(s));
      s2.addr = null;
      s2.bytes = 0;
      s2.oldline = s.line;
      if (s.remark && !s.opcode) {
        return s;
      }
      if (!s.params || s.params.length === 0)
        throw {
          msg: "Unrecognized instruction " + s.opcode,
          s
        };
      if (!s.opcode)
        throw {
          msg: "Unrecognized instruction " + s.opcode,
          s
        };
      if (s.params[0].indexOf(":=") === 0)
        s.params[0] = ".SET" + s.params[0].substr(2);
      s2.line = s.opcode + ": " + s.params.join();
      if (s.remark) s2.line += " ;" + s.remark;
      let sx = parseLine(s2, macros, { stopFlag: true, olds: s, ...opts });
      if (!sx.opcode)
        throw {
          msg: "Unrecognized instruction " + s.opcode,
          s
        };
      return sx;
    }
    if (opts.stopFlag)
      throw {
        msg: "Unrecognized instruction " + opts.olds.opcode,
        s
      };
    throw {
      msg: "Unrecognized instruction " + s.opcode,
      s
    };
  };

  // preprocessor.js
  var macroParams = (d, params = [], uniq, pars, qnumline) => {
    const out = {
      line: d.line,
      addr: d.addr,
      macro: d.macro,
      numline: d.numline
    };
    uniq = `${uniq}S${qnumline}`;
    const xpars = pars;
    if (xpars?.length > params.length) {
      out.numline = qnumline;
      throw {
        msg: "Too few parameters for macro unrolling",
        s: out
      };
    }
    for (const [index, par] of params.entries()) {
      let processedPar = par;
      if (par.startsWith("00bb")) {
        processedPar = atobx(par.substring(4));
      }
      out.line = out.line.replace(`%%${index + 1}`, processedPar);
      if (xpars?.[index]) {
        out.line = out.line.replace(xpars[index], processedPar);
      }
    }
    out.line = out.line.replace("%%M", `M_${uniq}`);
    out.line = out.line.replace("%%m", `M_${uniq}`);
    return out;
  };
  var findBlock = (ni, block, opts) => {
    if (!block) return ni;
    const out = [];
    let f = null;
    for (const l of ni) {
      const p = parseLine(l, {}, opts);
      if (f) out.push(l);
      if (p.opcode === ".ENDBLOCK") {
        if (f) {
          return out;
        }
      } else if (p.opcode === ".BLOCK") {
        if (f) return out;
        if (p.params[0].toUpperCase() === block.toUpperCase()) {
          out.push(l);
          f = true;
        }
      }
    }
    throw {
      msg: `Cannot find block ${block} in included file`
    };
  };
  var prepro = async (V, opts = {}, fullfile) => {
    if (!opts.includedFiles) opts.includedFiles = {};
    let op, ln, paramstring = null, px, params = null;
    const macros = {};
    let macroDefine = null;
    let reptCount = null;
    const out = [];
    let outi = 0;
    for (const item of V) {
      op = item.line;
      const remark = op.match(/\s*(.)/);
      if (remark?.[1] === ";") {
        out.push(item);
        continue;
      }
      ln = op.match(/\s*(\.[^\s]+)(.*)/);
      if (!ln) {
        if (macroDefine) {
          macros[macroDefine].push(item);
          continue;
        } else {
          out.push(item);
        }
        continue;
      }
      const opcode = ln[1].toUpperCase();
      const pp = ln[2].match(/^\s*([^;]*)(.*)/);
      if (pp?.[1].length) {
        paramstring = pp[1];
        px = pp[1].split(/\s*,\s*/);
        params = px.map((q) => q.trim());
      } else {
        params = null;
      }
      if (opcode === ".INCLUDE" && opts.noinclude) continue;
      if (opcode === ".INCLUDE") {
        let block = "";
        if (!params?.[0]) throw {
          msg: "No file name given",
          s: item
        };
        if (params[0].includes(":")) {
          const px2 = params[0].split(":");
          params[0] = px2[0];
          block = px2[1];
          if (px2.length === 3) {
            block = px2[2];
          } else {
            if (opts.includedFiles[`*${px2[0].toUpperCase()}:${block.toUpperCase()}`]) {
              continue;
            }
          }
          opts.includedFiles[`*${px2[0].toUpperCase()}:${block.toUpperCase()}`] = "used";
        }
        let ni, fullni, nf;
        if (params[0].toUpperCase() === "THIS" && block) {
          ni = findBlock(fullfile, block, opts);
        } else {
          nf = await opts.readFile(params[0].replace(/\"/g, ""));
          if (!nf) throw {
            msg: `File ${params[0]} not found`,
            s: item
          };
          ni = toInternal(nf.split(/\n/));
          ni = nonempty(ni);
          ni = norm(ni);
          fullni = ni;
          ni = findBlock(ni, block, opts);
        }
        const preni = await prepro(ni, opts, fullni);
        for (const preniItem of preni[0]) {
          preniItem.includedFile = params[0].replace(/\"/g, "");
          preniItem.includedFileAtLine = item.numline;
          out.push(preniItem);
        }
        for (const k of Object.keys(preni[1])) {
          macros[k] = preni[1][k];
        }
        opts.includedFiles[params[0].replace(/\"/g, "")] = nf;
        continue;
      }
      if (opcode === ".ENDM") {
        if (!macroDefine) {
          throw {
            msg: `ENDM without MACRO at line ${item.numline}`,
            s: item
          };
        }
        if (reptCount) {
          out.push({
            numline: item.numline,
            line: ";rept unroll",
            addr: null,
            bytes: 0,
            remark: "REPT unroll"
          });
          for (const _ of Array(reptCount)) {
            for (const macline of macros[macroDefine]) {
              out.push({
                numline: item.numline,
                line: macline.line,
                addr: null,
                bytes: 0
              });
            }
          }
        } else {
          const pars = macros[macroDefine]?.[0] ?? [];
          out.push({
            numline: item.numline,
            line: `;Macro define ${macroDefine}`,
            addr: null,
            bytes: 0,
            listing: `.macro ${macroDefine}${pars ? "," : ""}${pars.join(",")}`
          });
          const md = macros[macroDefine];
          for (const macroLine of md) {
            if (!macroLine) continue;
            out.push({
              line: ";",
              listing: macroLine.line
            });
          }
          out.push({
            line: ";",
            listing: ".endm"
          });
          out.push({
            line: ";",
            listing: " "
          });
        }
        macroDefine = null;
        reptCount = null;
        continue;
      }
      if (opcode === ".MACRO") {
        if (op[0] === ";") continue;
        let macroName = null;
        const test = op.match(/^(\S+)\s+\.MACRO/i);
        if (test) {
          macroName = test[1];
        } else {
          if (params?.[0]) macroName = params.shift();
        }
        if (!macroName)
          throw {
            msg: `Bad macro name at line ${item.numline}`,
            s: item
          };
        if (macroName.endsWith(":"))
          macroName = macroName.slice(0, -1);
        macroDefine = macroName.toUpperCase();
        if (macros[macroDefine])
          throw {
            msg: `Macro ${macroDefine} redefinition at line ${item.numline}`,
            s: item
          };
        macros[macroDefine] = [params];
        continue;
      }
      if (opcode === ".REPT") {
        if (!params?.[0]) throw {
          msg: "No repeat count given",
          s: item
        };
        reptCount = Parser.evaluate(params[0]);
        if (!reptCount || reptCount < 1) throw {
          msg: "Bad repeat count given",
          s: item
        };
        macroDefine = `*REPT${item.numline}`;
        if (macros[macroDefine])
          throw {
            msg: `Macro redefinition at line ${item.numline}`,
            s: item
          };
        macros[macroDefine] = [];
        continue;
      }
      if (macroDefine) {
        macros[macroDefine].push(item);
        continue;
      }
      out.push(item);
    }
    if (macroDefine) {
      throw {
        msg: `MACRO ${macroDefine} has no appropriate ENDM`
        //s: item,
      };
    }
    return [out, macros];
  };
  var unroll = (V, macros, uniqseed, opts) => {
    if (!uniqseed) uniqseed = "";
    const out = [];
    for (const [i, s] of V.entries()) {
      if (!s) console.log("V", V, i);
      if (!s.macro) {
        out.push(s);
        continue;
      }
      const m = macros[s.macro];
      const pars = m[0];
      out.push({
        remark: `*Macro unroll: ${s.line}`
      });
      for (const [j, macroItem] of m.entries()) {
        if (j === 0) continue;
        const preline = macroParams(
          macroItem,
          s.params,
          i + uniqseed,
          pars,
          s.numline
        );
        preline.bytes = 0;
        const ng = parseLine(preline, macros, { assembler: opts.assembler });
        if (ng.macro) {
          const nest = unroll([ng], macros, `${uniqseed}_${i}`, opts);
          for (const nestItem of nest) {
            out.push(nestItem);
          }
          continue;
        }
        if (s.label) ng.label = s.label;
        s.label = "";
        ng.remark = s.remark;
        ng.macro = s.macro;
        s.macro = null;
        s.remark = "";
        out.push(ng);
      }
    }
    return out;
  };

  // parser.js
  var parse = async (s, opts) => {
    let i = toInternal(s.split(/\n/));
    i = noncomments(i);
    i = nonempty(i);
    i = norm(i);
    let prei = await prepro(i, opts);
    i = prei[0].map((line) => parseLine(line, prei[1], opts));
    i = unroll(i, prei[1], null, opts);
    return i;
  };

  // cpu/z80.js
  var Z80 = {
    endian: false,
    cpu: "z80",
    ext: "z80",
    set: {
      // 0 nebo 1 parametr
      //         0     1     2       3      4      5     6       7      8      9     10    11     12    13
      //         0 /  /A,r/ A,N /   R8  /   N   / R16 / R16A /  POP   COND /  IMM /  RST /  REL  / ABS / (HL)
      //		ADC: [    -1,    -1,  0x88,  0xce,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1],
      DEC: [-1, -1, -1, -1, 5, -1, 11, -1, -1, -1, -1, -1, -1, -1],
      INC: [-1, -1, -1, -1, 4, -1, 3, -1, -1, -1, -1, -1, -1, -1],
      AND: [-1, -1, -1, -1, 160, 230, -1, -1, -1, -1, -1, -1, -1, -1],
      OR: [-1, -1, -1, -1, 176, 246, -1, -1, -1, -1, -1, -1, -1, -1],
      XOR: [-1, -1, -1, -1, 168, 238, -1, -1, -1, -1, -1, -1, -1, -1],
      SUB: [-1, -1, -1, -1, 144, 214, -1, -1, -1, -1, -1, -1, -1, -1],
      CP: [-1, -1, -1, -1, 184, 254, -1, -1, -1, -1, -1, -1, -1, -1],
      SLA: [-1, -1, -1, -1, 52e3, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      SRA: [-1, -1, -1, -1, 52008, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      SLL: [-1, -1, -1, -1, 52016, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      SRL: [-1, -1, -1, -1, 52024, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RR: [-1, -1, -1, -1, 51992, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RL: [-1, -1, -1, -1, 51984, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RRC: [-1, -1, -1, -1, 51976, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RLC: [-1, -1, -1, -1, 51968, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      POP: [-1, -1, -1, -1, -1, -1, -1, 193, -1, -1, -1, -1, -1, -1],
      PUSH: [-1, -1, -1, -1, -1, -1, -1, 197, -1, -1, -1, -1, -1, -1],
      RET: [201, -1, -1, -1, -1, -1, -1, -1, 192, -1, -1, -1, -1, -1],
      IM: [-1, -1, -1, -1, -1, -1, -1, -1, -1, 60742, -1, -1, -1, -1],
      RST: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 199, -1, -1, -1],
      CALL: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 205, -1],
      JP: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 195, 233],
      DJNZ: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 16, -1, -1],
      JR: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 24, -1, -1],
      NOP: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CCF: [63, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CPD: [60841, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CPDR: [60857, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CPI: [60833, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CPIR: [60849, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      CPL: [47, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      DAA: [39, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      DI: [243, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      EI: [251, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      EXX: [217, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      IND: [60842, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      INDR: [60858, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      INI: [60834, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      INIR: [60850, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      LDD: [60840, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      LDDR: [60856, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      LDI: [60832, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      LDIR: [60848, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      OUTD: [60843, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      OTDR: [60859, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      OUTI: [60835, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      OTIR: [60851, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      HALT: [118, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      NEG: [60740, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RETI: [60749, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RETN: [60741, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RLA: [23, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RLCA: [7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RLD: [60783, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RRA: [31, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RRCA: [15, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      RRD: [60775, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      SCF: [55, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
    },
    set2: {
      // two params
      //    0      1    2       3      4     5
      // a,r8 /   a,n/HL,r16/XX,r16/  b,r8/  c,ABS/
      EX: [0],
      LD: [0],
      ADC: [136, 206, 60746],
      ADD: [128, 198, 9, 9],
      SBC: [152, 222, 60738],
      BIT: [-1, -1, -1, -1, 52032],
      RES: [-1, -1, -1, -1, 52096],
      SET: [-1, -1, -1, -1, 52160],
      CAL2: [-1, -1, -1, -1, -1, 196],
      JP2: [-1, -1, -1, -1, -1, 194],
      JR2: [-1, -1, -1, -1, -1, 32],
      IN: [60736, 219, -1, -1, -1, -1],
      OUT: [60737, 211, -1, -1, -1, -1]
    },
    //r16 = BC, DE, HL, SP
    //r16a = BC, DE, HL, AF
    R8: {
      DEC: 3,
      INC: 3
    },
    R16: {
      DEC: 4,
      INC: 4,
      POP: 4,
      PUSH: 4
    },
    /*
    
    
     */
    parseOpcode: function(s, vars, Parser2) {
      var R8 = function(reg3) {
        var n = ["B", "C", "D", "E", "H", "L", "~", "A"].indexOf(reg3.toUpperCase());
        if (reg3.toUpperCase() == "(HL)") return 6;
        return n;
      };
      var R8F = function(reg3) {
        return ["B", "C", "D", "E", "H", "L", "F", "A"].indexOf(reg3.toUpperCase());
      };
      var R16 = function(reg3) {
        var n = ["BC", "DE", "HL", "SP"].indexOf(reg3.toUpperCase());
        return n;
      };
      var R16IX = function(reg3) {
        var n = ["BC", "DE", "IX", "SP"].indexOf(reg3.toUpperCase());
        return n;
      };
      var R16IY = function(reg3) {
        var n = ["BC", "DE", "IY", "SP"].indexOf(reg3.toUpperCase());
        return n;
      };
      var R16A = function(reg3) {
        var n = ["BC", "DE", "HL", "AF"].indexOf(reg3.toUpperCase());
        return n;
      };
      var COND = function(reg3) {
        var n = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"].indexOf(reg3.toUpperCase());
        return n;
      };
      var LINK = function(par3) {
        if (par3[0] == "(" && par3[par3.length - 1] == ")") {
          return par3.substr(1, par3.length - 2);
        } else return null;
      };
      var indexes = function(par3) {
        var disp2 = null;
        var prefix2 = null;
        var idx3 = par3.replace(/\s/g, "").substr(0, 4).toUpperCase();
        if (idx3 == "(IX)") {
          disp2 = "0";
          prefix2 = 221;
          par3 = "(HL)";
        }
        if (idx3 == "(IX+") {
          disp2 = par3.substr(4, par3.length - 5);
          prefix2 = 221;
          par3 = "(HL)";
        }
        if (idx3 == "(IX-") {
          disp2 = "-" + par3.substr(4, par3.length - 5);
          prefix2 = 221;
          par3 = "(HL)";
        }
        if (idx3 == "(IY)") {
          disp2 = "0";
          prefix2 = 253;
          par3 = "(HL)";
        }
        if (idx3 == "(IY+") {
          disp2 = par3.substr(4, par3.length - 5);
          prefix2 = 253;
          par3 = "(HL)";
        }
        if (idx3 == "(IY-") {
          disp2 = "-" + par3.substr(4, par3.length - 5);
          prefix2 = 253;
          par3 = "(HL)";
        }
        if (idx3 == "IX") {
          prefix2 = 221;
          par3 = "HL";
        }
        if (idx3 == "IY") {
          prefix2 = 253;
          par3 = "HL";
        }
        if (idx3 == "IXL") {
          prefix2 = 221;
          par3 = "L";
        }
        if (idx3 == "IXH") {
          prefix2 = 221;
          par3 = "H";
        }
        if (idx3 == "IYL") {
          prefix2 = 253;
          par3 = "L";
        }
        if (idx3 == "IYH") {
          prefix2 = 253;
          par3 = "H";
        }
        return [par3, disp2, prefix2];
      };
      var ax = Z80.set[s.opcode];
      var ax2 = Z80.set2[s.opcode];
      var op = -1, bytes = 1, lens = [];
      var prefix = null, disp = null;
      var reg, param8, mode, idx;
      if (ax && !ax2) {
        if ((s.params ? s.params.length : 0) > 1) {
          if (s.opcode !== "JP" && s.opcode !== "JR" && s.opcode !== "CALL")
            throw "One parameter needed";
        }
      }
      if (!ax && ax2) {
        ax = ax2;
        if ((s.params ? s.params.length : 0) !== 2) {
          throw "Two parameters needed";
        }
      }
      s.wia = 1;
      if (ax) {
        if (!s.params || s.params.length === 0) {
          op = ax[0];
        } else if (s.params.length == 1) {
          var par = s.params[0];
          idx = indexes(par);
          par = idx[0];
          disp = idx[1];
          prefix = idx[2];
          if (ax[11] > 0) {
            s.bytes = 2;
            s.lens = [];
            s.lens[0] = ax[11];
            s.lens[1] = function(vars2) {
              var lab = Parser2.evaluate(par, vars2);
              var pc = vars2._PC + 2;
              var disp2 = lab - pc;
              if (disp2 > 127) throw "Target is out of relative jump reach";
              if (disp2 < -128) throw "Target is out of relative jump reach";
              if (disp2 < 0) {
                disp2 = 256 + disp2;
              }
              return disp2;
            };
            return s;
          }
          if (ax[12] > 0) {
            s.lens = [];
            if (par.toUpperCase() == "(HL)" && ax[13] > 0) {
              if (!idx[2]) {
                s.bytes = 1;
                s.lens[0] = ax[13];
              } else {
                s.bytes = 2;
                s.lens[0] = idx[2];
                s.lens[1] = ax[13];
              }
              return s;
            }
            s.bytes = 3;
            s.lens[0] = ax[12];
            s.lens[1] = function(vars2) {
              return Parser2.evaluate(par, vars2);
            };
            s.lens[2] = null;
            return s;
          }
          if (ax[9] > 0) {
            s.bytes = 2;
            s.lens = [];
            s.lens[0] = 237;
            mode = Parser2.evaluate(par);
            switch (mode) {
              case 0:
                s.lens[1] = 70;
                return s;
              case 1:
                s.lens[1] = 86;
                return s;
              case 2:
                s.lens[1] = 94;
                return s;
            }
            throw "Invalid interrupt mode";
          }
          if (ax[10] > 0) {
            s.bytes = 1;
            s.lens = [];
            mode = Parser2.evaluate(par);
            switch (mode) {
              case 0:
                s.lens[0] = 199;
                return s;
              case 8:
                s.lens[0] = 207;
                return s;
              case 16:
                s.lens[0] = 215;
                return s;
              case 24:
                s.lens[0] = 223;
                return s;
              case 32:
                s.lens[0] = 231;
                return s;
              case 40:
                s.lens[0] = 239;
                return s;
              case 48:
                s.lens[0] = 247;
                return s;
              case 56:
                s.lens[0] = 255;
                return s;
            }
            throw "Invalid RST";
          }
          reg = COND(par);
          if (reg >= 0 && ax[8] > 0) {
            op = ax[8];
            if (op > 0) {
              op += reg << 3;
            }
          } else {
            reg = R16(par);
            if (reg >= 0 && ax[6] >= 0) {
              op = ax[6];
              if (op > 0) {
                if (Z80.R16[s.opcode]) {
                  op += reg << Z80.R16[s.opcode];
                } else {
                  op += reg;
                }
              }
            } else {
              reg = R16A(par);
              if (reg >= 0 && ax[7] >= 0) {
                op = ax[7];
                if (op > 0) {
                  if (Z80.R16[s.opcode]) {
                    op += reg << Z80.R16[s.opcode];
                  } else {
                    op += reg;
                  }
                }
              } else {
                reg = R8(par);
                if (reg >= 0 && ax[4] > 0) {
                  op = ax[4];
                  if (op > 0) {
                    if (Z80.R8[s.opcode]) {
                      op += reg << Z80.R8[s.opcode];
                    } else {
                      op += reg;
                    }
                  }
                } else {
                  op = ax[5];
                  param8 = function(vars2) {
                    return Parser2.evaluate(par, vars2);
                  };
                }
              }
            }
          }
        } else if (s.params.length == 2) {
          var par1 = s.params[0];
          var par2 = s.params[1];
          if (s.opcode == "EX") {
            if (par1.toUpperCase() == "DE" && par2.toUpperCase() == "HL") {
              s.lens = [235];
              s.bytes = 1;
              return s;
            }
            if (par1.toUpperCase() == "AF" && par2.toUpperCase() == "AF'") {
              s.lens = [8];
              s.bytes = 1;
              return s;
            }
            if (par1.toUpperCase() == "(SP)" && par2.toUpperCase() == "HL") {
              s.lens = [227];
              s.bytes = 1;
              return s;
            }
            if (par1.toUpperCase() == "(SP)" && par2.toUpperCase() == "IX") {
              s.lens = [221, 227];
              s.bytes = 2;
              return s;
            }
            if (par1.toUpperCase() == "(SP)" && par2.toUpperCase() == "IY") {
              s.lens = [253, 227];
              s.bytes = 2;
              return s;
            }
            return null;
          }
          if (s.opcode == "CALL") {
            ax = Z80.set2.CAL2;
            reg = COND(par1);
            if (reg >= 0 && ax[5] > 0) {
              op = ax[5];
              if (op > 0) {
                op += reg << 3;
                s.bytes = 3;
                s.lens = [];
                s.lens[0] = op;
                s.lens[1] = function(vars2) {
                  return Parser2.evaluate(par2, vars2);
                };
                s.lens[2] = null;
                return s;
              }
            } else if (reg < 0) {
              throw "Invalid CALL COND code: " + reg;
            }
            return null;
          }
          if (s.opcode == "JP") {
            ax = Z80.set2.JP2;
            reg = COND(par1);
            if (reg >= 0 && ax[5] > 0) {
              op = ax[5];
              if (op > 0) {
                op += reg << 3;
                s.bytes = 3;
                s.lens = [];
                s.lens[0] = op;
                s.lens[1] = function(vars2) {
                  return Parser2.evaluate(par2, vars2);
                };
                s.lens[2] = null;
                return s;
              }
            } else if (reg < 0) {
              throw "Invalid JP COND code: " + reg;
            }
            return null;
          }
          if (s.opcode == "JR") {
            ax = Z80.set2.JR2;
            reg = COND(par1);
            if (reg >= 0 && reg < 4 && ax[5] > 0) {
              op = ax[5];
              if (op > 0) {
                op += reg << 3;
                s.bytes = 2;
                s.lens = [];
                s.lens[0] = op;
                s.lens[1] = function(vars2) {
                  var lab = Parser2.evaluate(par2, vars2);
                  var pc = vars2._PC + 2;
                  var disp2 = lab - pc;
                  if (disp2 > 127) throw "Target is out of relative jump reach";
                  if (disp2 < -128) throw "Target is out of relative jump reach";
                  if (disp2 < 0) {
                    disp2 = 256 + disp2;
                  }
                  return disp2;
                };
                return s;
              }
            } else if (reg < 0) {
              throw "Invalid JR COND code: " + reg;
            }
            return null;
          }
          if (s.opcode == "IN") {
            if (par2.toUpperCase() == "(C)") {
              reg = R8F(par1);
              if (reg >= 0 && ax[0]) {
                s.lens = [237, 64 + (reg << 3)];
                s.bytes = 2;
                return s;
              }
            }
            if (par1.toUpperCase() == "A") {
              s.lens = [ax[1]];
              s.lens[1] = function(vars2) {
                return Parser2.evaluate(par2, vars2);
              };
              s.bytes = 2;
              return s;
            }
            return null;
          }
          if (s.opcode == "OUT") {
            if (par1.toUpperCase() == "(C)") {
              reg = R8F(par2);
              if (reg >= 0 && ax[0]) {
                s.lens = [237, 65 + (reg << 3)];
                s.bytes = 2;
                return s;
              }
            }
            if (par2.toUpperCase() == "A") {
              s.lens = [ax[1]];
              s.lens[1] = function(vars2) {
                return Parser2.evaluate(par1, vars2);
              };
              s.bytes = 2;
              return s;
            }
            return null;
          }
          if (s.opcode == "LD") {
            if (par1.toUpperCase() == "A" && par2.toUpperCase() == "R") {
              s.bytes = 2;
              s.lens = [237, 95];
              return s;
            }
            if (par1.toUpperCase() == "A" && par2.toUpperCase() == "I") {
              s.bytes = 2;
              s.lens = [237, 87];
              return s;
            }
            if (par1.toUpperCase() == "R" && par2.toUpperCase() == "A") {
              s.bytes = 2;
              s.lens = [237, 79];
              return s;
            }
            if (par1.toUpperCase() == "I" && par2.toUpperCase() == "A") {
              s.bytes = 2;
              s.lens = [237, 71];
              return s;
            }
            if (par1.toUpperCase() == "HL" && par2.toUpperCase() == "DE") {
              s.bytes = 2;
              s.lens = [98, 107];
              return s;
            }
            if (par1.toUpperCase() == "HL" && par2.toUpperCase() == "BC") {
              s.bytes = 2;
              s.lens = [96, 105];
              return s;
            }
            if (par1.toUpperCase() == "DE" && par2.toUpperCase() == "HL") {
              s.bytes = 2;
              s.lens = [84, 93];
              return s;
            }
            if (par1.toUpperCase() == "DE" && par2.toUpperCase() == "BC") {
              s.bytes = 2;
              s.lens = [80, 89];
              return s;
            }
            if (par1.toUpperCase() == "BC" && par2.toUpperCase() == "HL") {
              s.bytes = 2;
              s.lens = [68, 77];
              return s;
            }
            if (par1.toUpperCase() == "BC" && par2.toUpperCase() == "DE") {
              s.bytes = 2;
              s.lens = [66, 75];
              return s;
            }
            var idx1 = indexes(par1);
            par1 = idx1[0];
            disp = idx1[1];
            prefix = idx1[2];
            var idx2 = indexes(par2);
            par2 = idx2[0];
            if (idx2[1] && disp) {
              throw "Invalid parameters - two indexed";
            }
            if (idx2[1]) disp = idx2[1];
            if (idx2[2] && prefix) {
              throw "Invalid parameters - two prefixed";
            }
            if (idx2[2]) prefix = idx2[2];
            var reg1 = R8(par1);
            var reg2 = R8(par2);
            lens = [];
            if (reg1 >= 0 && reg2 >= 0) {
              s.bytes = 1;
              lens[0] = 64 + (reg1 << 3) + reg2;
            }
            if (par1.toUpperCase() == "A" && par2.toUpperCase() == "(BC)") {
              s.bytes = 1;
              s.lens = [10];
              return s;
            }
            if (par1.toUpperCase() == "A" && par2.toUpperCase() == "(DE)") {
              s.bytes = 1;
              s.lens = [26];
              return s;
            }
            if (par1.toUpperCase() == "A" && LINK(par2) && s.bytes === 0) {
              s.bytes = 3;
              s.lens = [58, function(vars2) {
                return Parser2.evaluate(LINK(par2), vars2);
              }, null];
              return s;
            }
            if (par1.toUpperCase() == "(BC)" && par2.toUpperCase() == "A") {
              s.bytes = 1;
              s.lens = [2];
              return s;
            }
            if (par1.toUpperCase() == "(DE)" && par2.toUpperCase() == "A") {
              s.bytes = 1;
              s.lens = [18];
              return s;
            }
            if (LINK(par1) && par2.toUpperCase() == "A" && s.bytes === 0) {
              s.bytes = 3;
              s.lens = [50, function(vars2) {
                return Parser2.evaluate(LINK(par1), vars2);
              }, null];
              return s;
            }
            if (reg1 == 7 && reg2 < 0 && par2[0] == "(") {
              s.bytes = 3;
              lens[0] = 58;
              lens[1] = function(vars2) {
                return Parser2.evaluate(par2, vars2);
              };
              lens[2] = null;
              return s;
            }
            if (reg1 >= 0 && reg2 < 0 && par2[0] == "(") {
              throw "Invalid combination: general register and memory";
            }
            if (reg1 >= 0 && reg2 < 0) {
              s.bytes = 2;
              lens[0] = 6 + (reg1 << 3);
              lens[1] = function(vars2) {
                return Parser2.evaluate(par2, vars2);
              };
            }
            if (s.bytes === 0) {
              reg1 = R16(par1);
              reg2 = R16(par2);
              var link1 = LINK(par1);
              var link2 = LINK(par2);
              if (reg1 >= 0 && !link2) {
                s.bytes = 3;
                lens = [1 + (reg1 << 4), function(vars2) {
                  return Parser2.evaluate(par2, vars2);
                }, null];
              }
              if (reg1 >= 0 && link2) {
                s.bytes = [4, 4, 3, 4][reg1];
                lens = [237, 75 + (reg1 << 4), function(vars2) {
                  return Parser2.evaluate(link2, vars2);
                }, null];
                s.wia = 2;
                if (s.bytes == 3) {
                  s.wia = 1;
                  lens = [42, function(vars2) {
                    return Parser2.evaluate(link2, vars2);
                  }, null];
                }
              }
              if (link1 && reg2 >= 0) {
                s.bytes = [4, 4, 3, 4][reg2];
                s.wia = 2;
                lens = [237, 67 + (reg2 << 4), function(vars2) {
                  return Parser2.evaluate(link1, vars2);
                }, null];
                if (s.bytes == 3) {
                  s.wia = 1;
                  lens = [34, function(vars2) {
                    return Parser2.evaluate(link1, vars2);
                  }, null];
                }
              }
              if (reg1 == 3 && reg2 == 2) {
                s.bytes = 1;
                lens = [249];
              }
            }
            if (!lens.length) return null;
            if (prefix) {
              lens.unshift(prefix);
              s.bytes++;
            }
            if (disp) {
              if (s.bytes == 3) {
                lens[3] = lens[2];
                lens[2] = function(vars2) {
                  var d = Parser2.evaluate(disp, vars2);
                  if (d > 127 || d < -128) throw "Index out of range (" + d + ")";
                  return d;
                };
                s.bytes = 4;
              }
              if (s.bytes == 2) {
                lens[2] = function(vars2) {
                  var d = Parser2.evaluate(disp, vars2);
                  if (d > 127 || d < -128) throw "Index out of range (" + d + ")";
                  return d;
                };
                s.bytes = 3;
              }
            }
            s.lens = lens;
            return s;
          }
          if (ax[4] >= 0) {
            var bit = parseInt(par1, 10);
            idx = indexes(par2);
            par2 = idx[0];
            disp = idx[1];
            prefix = idx[2];
            reg = R8(par2);
            op = ax[4] + 8 * bit + reg;
          }
          if (par1.toUpperCase() == "A") {
            idx = indexes(par2);
            par2 = idx[0];
            disp = idx[1];
            prefix = idx[2];
            if ((reg = R8(par2)) >= 0) {
              op = ax[0] + reg;
            } else {
              op = ax[1];
              param8 = function(vars2) {
                return Parser2.evaluate(par2, vars2);
              };
            }
          }
          if (par1.toUpperCase() == "IX") {
            if ((reg = R16IX(par2)) >= 0) {
              op = ax[2] + (reg << 4);
              prefix = 221;
            }
          }
          if (par1.toUpperCase() == "IY") {
            if ((reg = R16IY(par2)) >= 0) {
              op = ax[2] + (reg << 4);
              prefix = 253;
            }
          }
          if (par1.toUpperCase() == "HL") {
            if ((reg = R16(par2)) >= 0) {
              op = ax[2] + (reg << 4);
            }
          }
        }
        if (op < 0) {
          throw "Bad addressing mode at line " + s.numline;
        }
        if (op > 255) {
          bytes++;
          lens[0] = (op & 65280) >> 8;
          lens[1] = op & 255;
        } else {
          lens[0] = op & 255;
        }
        var safeparse = function(d) {
          try {
            if (!vars) vars = {};
            return Parser2.evaluate(d, vars);
          } catch (e) {
            return null;
          }
        };
        if (prefix) {
          lens.unshift(prefix);
          bytes++;
        }
        if (disp !== null && disp !== void 0) {
          if (bytes == 3) {
            lens[3] = lens[2];
            lens[2] = (vars2) => {
              var d = Parser2.evaluate(disp, vars2);
              if (d > 127 || d < -128) throw "Index out of range (" + d + ")";
              return d;
            };
            bytes = 4;
          }
          if (bytes == 2) {
            lens[2] = (vars2) => {
              var d = Parser2.evaluate(disp, vars2);
              if (d > 127 || d < -128) throw "Index out of range (" + d + ")";
              return d;
            };
            bytes = 3;
          }
        }
        if (param8) {
          lens.push(param8);
          bytes++;
        }
        s.lens = lens;
        s.bytes = bytes;
        return s;
      }
      return null;
    }
  };

  // asm.js
  var cpus = [Z80];
  var compile = async (source, fileSystem, opts = { assembler: null }, filename = "noname") => {
    if (typeof opts.assembler == "string") {
      opts.assembler = cpus.find((x) => x.cpu.toUpperCase() == opts.assembler.toUpperCase());
    }
    if (!opts.assembler || typeof opts.assembler != "object") {
      throw { msg: "No assembler specified", s: "Assembler error" };
    }
    opts = {
      ...opts,
      readFile: fileSystem.readFile,
      endian: false,
      ENT: null,
      BINFROM: null,
      BINTO: null,
      ENGINE: null,
      PRAGMAS: [],
      includedFiles: {},
      endian: opts.assembler.endian,
      xfre: {},
      xref: {}
    };
    try {
      let parsedSource = await parse(source, opts);
      let metacode = await pass1(parsedSource, null, opts);
      metacode = await pass1(metacode[0], metacode[1], opts);
      metacode = await pass1(metacode[0], metacode[1], opts);
      metacode = await pass1(metacode[0], metacode[1], opts);
      metacode = await pass1(metacode[0], metacode[1], opts);
      metacode[1]["__PRAGMAS"] = opts.PRAGMAS;
      metacode = pass2(metacode, opts);
      let out = {
        dump: metacode[0],
        vars: metacode[1],
        xref: opts.xref,
        opts
      };
      let vars = metacode[1];
      if (vars && typeof vars.__PRAGMAS !== "undefined" && vars.__PRAGMAS.indexOf("MODULE") != -1) {
        let obj = objCode(metacode[0], metacode[1], opts, filename);
        out.obj = obj;
      }
      return out;
    } catch (e) {
      let s = e.s || "Internal error";
      if (!e.msg) {
        throw {
          error: {
            msg: `Cannot evaluate line ${opts.WLINE.numline}, there is some unspecified error (e.g. reserved world as label etc.)`,
            wline: opts.WLINE
          }
        };
      }
      if (!e.s) e.s = s;
      throw {
        error: {
          msg: e.msg,
          s: e.s
          //wline: opts.WLINE
        }
      };
    }
  };
  var getfn = (fullpath) => {
    let parts = fullpath.split("/");
    return parts[parts.length - 1];
  };
  var compileFromFile = async (filePath, fileSystem, opts = { assembler: null }) => {
    let source = await fileSystem.readFile(filePath);
    return compile(source, fileSystem, opts, getfn(filePath));
  };
  var link = async (linkList, fileSystem, name = "noname") => {
    let cpu = null;
    let endian = null;
    let modules = await Promise.all(linkList.modules.map(async (m) => {
      let f = JSON.parse(await fileSystem.readFile(m + ".obj"));
      if (!cpu) cpu = f.cpu;
      if (cpu != f.cpu) throw { msg: "Different CPU in module " + m, s: "Linker error" };
      if (!endian) endian = f.endian;
      if (endian != f.endian) throw { msg: "Different endian in module " + m, s: "Linker error" };
      return f;
    }));
    let library = await Promise.all(linkList.library.map(async (m) => {
      let f = JSON.parse(await fileSystem.readFile(m + ".obj"));
      if (cpu != f.cpu) throw { msg: "Different CPU in library file " + m, s: "Linker error" };
      if (endian != f.endian) throw { msg: "Different endian in library file " + m, s: "Linker error" };
      return f;
    }));
    linkList.endian = endian;
    let out = linkModules(linkList, modules, library);
    return out;
  };
  ASM = {
    lst,
    html,
    compile,
    compileFromFile,
    link,
    cpus
  };
})();
