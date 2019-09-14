/*
 *  Majiang.View.Analyzer
 */
"use strict";

const $ = require('jquery');
const Majiang = require('../../majiang');
Majiang.View = {
    pai:     require('./pai'),
    Shoupai: require('./shoupai'),
};

let _status;
let _dapai;

module.exports = class Analyzer extends Majiang.Player {

constructor(id, root) {
    super(id);
    this._root = root;
    if (! _status) _status = $('.status .row', root);
    if (! _dapai)  _dapai  = $('.dapai .row', root);
    $('.status', root).empty();
    $('.dapai',  root).empty();
}

id(id) { this._id = id }

next(data) {
    $('.status', this._root).empty();
    $('.dapai',  this._root).empty();
    super.action(data);
}

action(data) {
    if (data.qipai || data.hule || data.pingju) {
        $('.status', this._root).empty();
    }
    if (data.qipai || data.zimo || data.gangzimo || data.fulou
        || data.hule || data.pingju)
    {
        $('.dapai',   this._root).empty();
    }
    super.action(data, ()=>{});
}

zimo(zimo, option) {
    super.zimo(zimo, option);
    if (! this._callback) return;
    if (zimo.l != this._model.menfeng) {
        this.redraw_status(this.get_status());
    }
}

dapai(dapai) {
    super.dapai(dapai);
    if (! this._callback) return;
    if (dapai.l == this._model.menfeng) {
        this.redraw_status(this.get_status());
        this.update_dapai(dapai.p.substr(0,2));
    }
}

gang(gang) {
    super.gang(gang);
    if (! this._callback) return;
    if (gang.l == this._model.menfeng) {
        this.update_dapai(gang.m);
    }
}

action_zimo(zimo, option) {

    this.redraw_status(this.get_status());

    let info  = [];
    let gang  = this.select_gang(info);
    let dapai = this.select_dapai(info);
    if (gang) {
        for (let i of info) {
            if (i.m == gang) {
                i.selected = true;
            }
        }
    }
    else if (dapai) {
        let p = dapai.substr(0,2);
        for (let i of info) {
            if (i.p == p && ! i.m) {
                i.selected = true;
            }
        }
    }
    this.redraw_dapai(info);
}

action_dapai(dapai) {
    let info = [];
    let fulou = this.select_fulou(dapai, info);
    if (fulou) {
        for (let i of info) {
            if (i.m == fulou) {
                i.selected = true;
            }
        }
    }
    this.redraw_status(info);
}

action_fulou(fulou) {

    this.redraw_status(this.get_status());

    let info  = [];
    let dapai = this.select_dapai(info);
    let p = dapai.substr(0,2);
    for (let i of info) {
        if (i.p == p && ! i.m) {
            i.selected = true;
        }
    }
    this.redraw_dapai(info);
}

get_status() {

    let info = [];
    let n_xiangting = Majiang.Util.xiangting(this._shoupai);
    let paishu = this._suanpai.paishu_all();
    let ev = this.eval_shoupai(this._shoupai, paishu);
    let n_tingpai;
    if (n_xiangting > 2) {
        if (this._shoupai._zimo)
                ev = null;
        else    n_tingpai = Majiang.Util.tingpai(this._shoupai)
                                .map(p=>this._suanpai._paishu[p[0]][p[1]])
                                .reduce((x,y)=> x + y);
    }
    info.push({
        m: '', n_xiangting: n_xiangting,
        ev: ev, n_tingpai: n_tingpai,
        shoupai: this._shoupai.toString()
    });
    return info;
}

redraw_status(info) {

    $('.status', this._root).empty();
    for (let i of info.sort((a,b) => a.selected ? -1
                                   : b.selected ?  1
                                   : b.ev - a.ev))
    {
        let row = _status.clone();
        row.attr('data-status', i.m);
        $('.xiangting', row).text(
                      i.n_xiangting == -1 ? '和了形'
                    : i.n_xiangting ==  0 ? '聴牌'
                    :                       `${i.n_xiangting}向聴`);
        if (i.ev != null) {
            if (i.n_tingpai == null) {
                let ev = Math.floor(i.ev * 100);
                ev = ev < 100 ? ('00' + ev).substr(-3) : '' + ev;
                ev = ev.replace(/(\d{2})$/, '.$1');
                $('.eval', row).text(ev);
            }
            else {
                let ev = i.n_tingpai
                       + (i.ev > i.n_tingpai ? `(+${i.ev - i.n_tingpai})` : '')
                       + '枚';
                $('.eval', row).text(ev);
            }
        }
        new Majiang.View.Shoupai($('.shoupai', row),
                        Majiang.Shoupai.fromString(i.shoupai)).redraw(true);
        let m = i.m.replace(/0/,'5');
        $('.action', row).text(
              m.match(/^[mpsz](\d)\1\1\1/) ? 'カン'
            : m.match(/^[mpsz](\d)\1\1/)   ? 'ポン'
            : m.match(/^[mps]/)            ? 'チー'
            :                                ''
        );
        $('.status', this._root).append(row);
    }
}

redraw_dapai(info) {

    $('.dapai', this._root).empty();
    for (let i of info.sort((a,b) => a.selected ? -1
                                   : b.selected ?  1
                                   : b.ev - a.ev))
    {
        let row = _dapai.clone();
        row.attr('data-dapai', i.m || i.p);
        $('.p', row).append(Majiang.View.pai(i.p));
        if (i.m) $('.p', row).append($('<span>').text('カン'));
        $('.xiangting', row).text(
                    i.n_xiangting == 0 ? '聴牌' : `${i.n_xiangting}向聴`);
        if (i.n_xiangting < 3) {
            let ev = Math.floor(i.ev * 100);
            ev = ev < 100 ? ('00' + ev).substr(-3) : '' + ev;
            ev = ev.replace(/(\d{2})$/, '.$1');
            $('.eval', row).text(ev);
        }
        else {
            let ev = i.n_tingpai
                   + (i.ev > i.n_tingpai ? `(+${i.ev - i.n_tingpai})` : '')
                   + '枚';
            $('.eval', row).text(ev);
        }
        for (let p of i.tingpai) {
            $('.tingpai', row).append(Majiang.View.pai(p));
        }
        if (i.n_xiangting < 3) {
            $('.tingpai', row).append($('<span>').text(`(${i.n_tingpai}枚)`));
        }
        $('.dapai', this._root).append(row);
    }
}

update_dapai(dapai) {
    $(`.dapai tr[data-dapai="${dapai}"]`).addClass('selected');
}

}
