// ===== helper to detect editable nodes =====
function isEditable(target){
  return !!(target && target.closest('input, textarea, [contenteditable=""], [contenteditable="true"]'));
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

async function init(){
  try{
    // Year
    var y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear();

    // Eyebrow label
    var eyebrow=document.getElementById('eyebrow');
    function setNowPlaying(on, labelText){
      if(!eyebrow) return;
      if(on){
        var text = labelText || '1-800  - bbno$, Ironmouse';
        eyebrow.innerHTML = '<strong id="npNow" class="flicker">Now Playing</strong> | ' + text;
      }else{
        eyebrow.textContent = 'Introducing';
      }
    }

    // Theme toggle
    var KEY='ny_theme_v2';
    var label=document.getElementById('themeLabel');
    var toggle=document.getElementById('themeToggle');
    var media=window.matchMedia('(prefers-color-scheme: dark)');
    var mode=localStorage.getItem(KEY)||'auto'; // auto | starlight | spacegray
    function system(){return media.matches?'spacegray':'starlight'}
    function applyTheme(){ var t=(mode==='auto'? system(): mode); document.documentElement.setAttribute('data-theme', t); }
    function setLabelFromState(){
      var v=document.documentElement.getAttribute('data-variant');
      if(v==='mouse'){ if(label) label.textContent='Mousey'; return; }
      if(v==='emo'){  if(label) label.textContent='Emo';   return; }
      if(v==='witch'){if(label) label.textContent='Witch'; return; }
      if(label) label.textContent=(mode==='spacegray'?'Space Gray': mode.charAt(0).toUpperCase()+mode.slice(1));
    }
    applyTheme(); setLabelFromState();
    media.addEventListener('change', function(){ if(mode==='auto'){ applyTheme(); setLabelFromState(); } });
    if(toggle) toggle.addEventListener('click', function(){ mode = (mode==='auto')?'starlight': (mode==='starlight')?'spacegray':'auto'; localStorage.setItem(KEY, mode); applyTheme(); setLabelFromState(); });

    // Smooth anchors
    var links=document.querySelectorAll('a[href^="#"]');
    for(var i=0;i<links.length;i++) links[i].addEventListener('click', function(e){ var id=this.getAttribute('href'); if(id.length>1){ e.preventDefault(); var el=document.querySelector(id); if(el) el.scrollIntoView({behavior:'smooth'}); } });

    // ===== Typewriter with typos that get fixed =====
    var TW={ kill:false, running:false };
    function startTypewriter(){
      var el=document.getElementById('typewriter'); if(!el) return;
      TW.kill=false; TW.running=true; el.classList.remove('no-caret');
      var out=''; var speed=40; var back=15; var i=0;

      function typo(mistake, fix, pause, erase){
        return [
          {op:'type', text:mistake},
          {op:'pause', ms: pause || 360},
          {op:'back',  n: (erase!=null?erase:mistake.length)},
          {op:'type', text:fix}
        ];
      }

      var steps=[
        {op:'type', text:'Cupertino-clean, dumb-approved. '},
        ...typo('Starlgiht ', 'Starlight '),
        {op:'type', text:'by day, '},
        {op:'type', text:'Space Gray '},
        ...typo('by nigg ', 'by night, '),
        {op:'type', text:'Polished, '},
        {op:'type', text:'zero pop-ups & maximum '},
        ...typo('brainasudhauihduhasjdalkjLJLKASD', 'braincells. '),
        {op:'type', text:'Crafted with too much caffeine and a healthy amount of cigs.'}
      ];

      function next(){ if(TW.kill) return; i++; if(i>=steps.length){ TW.running=false; return; } step(steps[i]); }
      function step(act){
        if(TW.kill) return;
        if(act.op==='type') type(act.text,0);
        else if(act.op==='back') backspace(act.n);
        else if(act.op==='pause') setTimeout(next, act.ms||300);
      }
      function type(s, idx){
        if(TW.kill) return;
        if(idx>=s.length){ next(); return; }
        out+=s.charAt(idx); el.textContent=out;
        setTimeout(function(){ type(s, idx+1); }, speed + Math.floor(Math.random()*14)-7);
      }
      function backspace(n){
        if(TW.kill) return;
        if(n<=0){ next(); return; }
        out=out.slice(0,-1); el.textContent=out;
        setTimeout(function(){ backspace(n-1); }, back);
      }
      step(steps[0]);
    }
    function stopTypewriter(){ TW.kill=true; TW.running=false; }
    startTypewriter();

    // ===== Footer rotation =====
    (function footCycle(){
      var node=document.getElementById('foot-rot'); if(!node) return;
      var lines=[
        'Powered by caffeine and questionable life choices.',
        'Fueled by spite and silly little scripts.',
        'Running on ramen, deadlines, and meowing.',
        '90% fewer bugs* (*the other 10% are features).'
      ];
      var idx=0; node.textContent=lines[idx];
      setInterval(function(){
        node.style.opacity=0;
        setTimeout(function(){ idx=(idx+1)%lines.length; node.textContent=lines[idx]; node.style.opacity=1; }, 480);
      }, 3600);
    })();

    // ===== LRC lyric sync (generic) =====
    var lyricCtx={ on:false, audio:null, h1:null, orig:'', update:null, lines:[], lastIndex:-1 };
    function parseLRC(txt){
      var out=[]; if(!txt) return out;
      var lines=txt.split(/\r?\n/);
      for(var i=0;i<lines.length;i++){
        var m=lines[i].match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/);
        if(m){
          var min=parseInt(m[1],10)||0;
          var sec=parseInt(m[2],10)||0;
          var ms=parseInt((m[3]||'0').padEnd(3,'0'),10)||0;
          var t=min*60000+sec*1000+ms;
          var text=(m[4]||'').trim();
          out.push({t:t, text:text});
        }
      }
      out.sort(function(a,b){return a.t-b.t});
      return out;
    }
    function startLyricWithText(audioEl, lrcText){
      var h=document.getElementById('heroTitle');
      if(!audioEl || !lrcText || !h) return;
      lyricCtx.audio=audioEl; lyricCtx.h1=h; lyricCtx.orig=h.textContent; lyricCtx.lines=parseLRC(lrcText);
      if(!lyricCtx.lines.length) return;
      lyricCtx.on=true; lyricCtx.lastIndex=-1;
      lyricCtx.update=function(){
        var t=lyricCtx.audio.currentTime*1000;
        var idx=-1;
        for(var i=0;i<lyricCtx.lines.length;i++){ if(lyricCtx.lines[i].t<=t) idx=i; else break; }
        if(idx!==lyricCtx.lastIndex){
          lyricCtx.lastIndex=idx;
          var newText = idx>=0 ? lyricCtx.lines[idx].text : lyricCtx.orig;
          lyricCtx.h1.style.opacity=0;
          setTimeout(function(){ lyricCtx.h1.textContent=newText; lyricCtx.h1.style.opacity=1; }, 120);
        }
      };
      audioEl.addEventListener('timeupdate', lyricCtx.update);
      audioEl.addEventListener('seeked',     lyricCtx.update);
      audioEl.addEventListener('play',       lyricCtx.update);
    }
    function stopLyric(){
      if(!lyricCtx.on) return;
      var a=lyricCtx.audio;
      if(a && lyricCtx.update){
        a.removeEventListener('timeupdate', lyricCtx.update);
        a.removeEventListener('seeked',     lyricCtx.update);
        a.removeEventListener('play',       lyricCtx.update);
      }
      if(lyricCtx.h1 && lyricCtx.orig){
        lyricCtx.h1.style.opacity=1;
        lyricCtx.h1.textContent=lyricCtx.orig;
      }
      lyricCtx.on=false;
    }

    // ===== Beat-synced "Now Playing" flicker (generic) =====
    var beat = { ctx:null, src:null, elem:null, analyser:null, data:null, ema:0, last:0, raf:0, active:false };
    function ensureAudioGraph(audioEl){
      if(!audioEl) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      if(!beat.ctx) beat.ctx = new AC();
      if(beat.ctx.state === 'suspended'){ beat.ctx.resume().catch(()=>{}); }
      if(beat.elem === audioEl && beat.src && beat.analyser) return;
      try{ if(beat.src) beat.src.disconnect(); }catch(_){}
      beat.elem = audioEl;
      beat.src = beat.ctx.createMediaElementSource(audioEl);
      beat.analyser = beat.ctx.createAnalyser();
      beat.analyser.fftSize = 1024;
      beat.analyser.smoothingTimeConstant = 0.85;
      beat.data = new Uint8Array(beat.analyser.fftSize);
      beat.src.connect(beat.analyser);
      beat.src.connect(beat.ctx.destination);
    }
    function pulseNowPlaying(){
      var np=document.getElementById('npNow');
      if(!np) return;
      np.classList.remove('beat'); void np.offsetWidth;
      np.classList.add('beat');
      setTimeout(function(){ np && np.classList.remove('beat'); }, 140);
    }
    function startBeat(audioEl){
      ensureAudioGraph(audioEl);
      if(!beat.analyser) return;
      beat.active=true; beat.ema=0; beat.last=0;
      function loop(){
        if(!beat.active) return;
        beat.analyser.getByteTimeDomainData(beat.data);
        var sum=0; for(var i=0;i<beat.data.length;i++){ var v=(beat.data[i]-128)/128; sum+=v*v; }
        var rms=Math.sqrt(sum/beat.data.length);
        beat.ema = beat.ema ? (beat.ema*0.93 + rms*0.07) : rms;
        var now=performance.now();
        if(rms > beat.ema*1.8 && (now - beat.last) > 180){
          pulseNowPlaying(); beat.last=now;
        }
        beat.raf=requestAnimationFrame(loop);
      }
      beat.raf=requestAnimationFrame(loop);
    }
    function stopBeat(){ beat.active=false; if(beat.raf) cancelAnimationFrame(beat.raf); }

    // ===== Load LRC files upfront =====
    const [mouseyLrc, emoLrc] = await Promise.all([
      fetch('assets/lrc/1800.lrc').then(r=>r.text()).catch(()=>''),  
      fetch('assets/lrc/emo.lrc').then(r=>r.text()).catch(()=>''),   
    ]);

    // ===== Mousey takeover =====
    function mouseTakeover(){
      if(document.documentElement.getAttribute('data-variant')==='mouse') return;
      smoothVariantSwitch(function(){ document.documentElement.setAttribute('data-variant','mouse'); setLabelFromState(); });
      setNowPlaying(true, '1-800  - bbno$, Ironmouse');
      stopLyric(); stopBeat();
      var a = document.getElementById('mouseyAudio');
      startLyricWithText(a, mouseyLrc);
      a.currentTime = 0;
      startBeat(a);
      a.play().catch(()=>{});
      stopTypewriter();
      var el=document.getElementById('typewriter'); if(!el) return;
      el.classList.remove('no-caret');
      var cur=el.textContent||'';
      (function back(){ if(cur.length===0){ return typeCTA(); } cur=cur.slice(0,-1); el.textContent=cur; setTimeout(back, 22); })();
      function typeCTA(){
        var prefix='ironmouse 💖 immune deficiency foundation — ';
        var i=0; el.textContent='';
        (function t(){ if(i<prefix.length){ el.textContent += prefix.charAt(i++); setTimeout(t, 50); } else { typeLink(); } })();
      }
      function typeLink(){
        var a=document.createElement('a');
        a.href='https://tiltify.com/@ironmouse/ironmouse';
        a.target='_blank'; a.rel='noopener noreferrer'; a.style.whiteSpace='pre';
        el.appendChild(a);
        var link='tiltify.com/@ironmouse/ironmouse', j=0;
        (function tl(){ if(j<link.length){ a.textContent+=link.charAt(j++); setTimeout(tl,42);} })();
      }
    }

    // ===== Emo takeover =====
    function emoTakeover(){
      if(document.documentElement.getAttribute('data-variant')==='emo') return;
      smoothVariantSwitch(function(){ document.documentElement.setAttribute('data-variant','emo'); setLabelFromState(); });
      setNowPlaying(true, 'Dear Maria Count Me In - All Time Low');
      stopTypewriter();
      stopLyric(); stopBeat();
      var a=document.getElementById('emoAudio');
      startLyricWithText(a, emoLrc);
      a.currentTime=0; startBeat(a); a && a.play().catch(()=>{});
      var el=document.getElementById('typewriter');
      if(el){
        el.classList.add('no-caret');
        el.textContent='';
        var txt='ITS NOT A PHASE MOM! ITS A LIFESTYLE!!!!!';
        (function type(i){
          if(i>=txt.length) return;
          el.textContent += txt.charAt(i);
          setTimeout(function(){ type(i+1); }, 42);
        })(0);
      }
    }

    // ===== Exit variant =====
    function mouseRelease(){
      var v = document.documentElement.getAttribute('data-variant');
      if(!v) return;
      smoothVariantSwitch(function(){ document.documentElement.removeAttribute('data-variant'); setLabelFromState(); });
      setNowPlaying(false);
      stopLyric(); stopBeat();
      var a1=document.getElementById('mouseyAudio'); if(a1){ a1.pause(); }
      var a2=document.getElementById('emoAudio');    if(a2){ a2.pause(); }
      var el=document.getElementById('typewriter');
      if(el){ el.textContent=''; el.classList.remove('no-caret'); }
      startTypewriter();
      document.body.classList.remove('crt-on');
      document.body.classList.remove('glitch-on');
      clearInterval(witchTitleTimer);
      document.title = defaultTitle;
    }

    // ===== prime audio on first gesture =====
    (function primeAudioOnce(){
      var a1=document.getElementById('mouseyAudio');
      var a2=document.getElementById('emoAudio');
      function unlock(){
        [a1,a2].forEach(function(a){
          if(!a) return;
          a.play().then(function(){ a.pause(); a.currentTime=0; }).catch(function(){});
        });
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('touchstart', unlock, true);
        window.removeEventListener('click', unlock, true);
      }
      window.addEventListener('pointerdown', unlock, true);
      window.addEventListener('touchstart', unlock, true);
      window.addEventListener('click', unlock, true);
    })();

    // ===== Triggers =====
    var seq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'], idx2=0;
    var buffer='';
    window.addEventListener('keydown', function(e){
      if (isEditable(e.target)) return;
      var k=e.key; if(k.length===1) k=k.toLowerCase();

      // Konami confetti
      if(k===seq[idx2] || k===seq[idx2].toLowerCase()){ idx2++; if(idx2===seq.length){ idx2=0; confetti(); return; } } else { idx2=0; }

      // rolling alphanumeric buffer
      if(/^[a-z0-9]$/.test(k)){
        buffer=(buffer+k).slice(-12);
        if(buffer.endsWith('1800')){ mouseTakeover(); buffer=''; return; }  
        if(buffer.endsWith('nyan')){ mouseRelease(); buffer=''; return; }   
        if(buffer.endsWith('meow')){ buffer=''; confetti(); return; }
        if(buffer.endsWith('glitch')){
          document.body.classList.add('crt-on');
          setTimeout(()=> document.body.classList.remove('crt-on'), 8000);
          buffer=''; return;
        }
        if(buffer.endsWith('glitchall')){
          document.body.classList.add('glitch-on');
          setTimeout(()=> document.body.classList.remove('glitch-on'), 8000);
          buffer=''; return;
        }
      }
      if(k==='g' || k==='G'){ document.body.classList.toggle('gremlin'); }
    });

    // Logo taps
    var taps=0, timer=null, logo=document.getElementById('logo');
    if(logo){
      function reset(){ taps=0; }
      function onTap(){
        clearTimeout(timer); taps++;
        if(taps===3){ mouseTakeover(); taps=0; return; }
        if(taps===7){ document.body.classList.toggle('gremlin'); taps=0; return; }
        timer=setTimeout(reset, 650);
      }
      logo.addEventListener('click', onTap);
      logo.addEventListener('touchstart', onTap, {passive:true});
    }

    // About pill 5-tap → Emo mode
    (function aboutFiveTap(){
      var aboutBtn = document.querySelector('.cta a[href="#about"]');
      if(!aboutBtn) return;
      var taps = 0, tmr = null, WINDOW_MS = 650;
      function reset(){ taps = 0; }
      function onTap(){
        clearTimeout(tmr); taps++;
        if(taps === 5){ taps = 0; emoTakeover(); return; }
        tmr = setTimeout(reset, WINDOW_MS);
      }
      aboutBtn.addEventListener('click', onTap);
      aboutBtn.addEventListener('touchstart', onTap, {passive:true});
    })();

    // confetti
    function confetti(){
      for(var i=0;i<36;i++){
        var s=document.createElement('div');
        s.textContent=['✨','💗','⭐','🐟','🌸'][i%5];
        s.style.position='fixed'; s.style.left=(Math.random()*100)+'%'; s.style.top='-10px';
        s.style.fontSize=(12+Math.random()*16)+'px';
        s.style.transition='transform 1.1s ease, opacity 1.1s ease'; s.style.zIndex='9999';
        document.body.appendChild(s);
        (function(el){
          setTimeout(function(){
            el.style.transform='translateY('+(window.innerHeight+40)+'px) rotate('+(Math.random()*360)+'deg)';
            el.style.opacity='0';
          }, 10);
          setTimeout(function(){ el.parentNode && el.parentNode.removeChild(el); }, 1300);
        })(s);
      }
    }

    // --- Right-click & snooping deterrents ---
    ['contextmenu','dragstart'].forEach(function(type){
      document.addEventListener(type, function(e){
        if (isEditable(e.target)) return; e.preventDefault();
      }, {capture:true});
    });
    ['mousedown','auxclick'].forEach(function(type){
      document.addEventListener(type, function(e){
        if (isEditable(e.target)) return;
        if (e.button === 2 || e.button === 1) { e.preventDefault(); }
      }, {capture:true});
    });
    document.addEventListener('keydown', function(e){
      if (isEditable(e.target)) return;
      var k = (e.key || '').toLowerCase();
      var blocked =
        k === 'f12' ||
        ((e.ctrlKey || e.metaKey) && k === 'u') ||
        ((e.ctrlKey || e.metaKey) && k === 's') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'));
      if (blocked){ e.preventDefault(); e.stopImmediatePropagation(); }
    }, {capture:true});

    // ===== WITCHING HOUR (visitor-local 3:00–3:30 AM) =====
    var HERO = document.getElementById('heroTitle');
    var TYPE = document.getElementById('typewriter');
    var EYEBROW = document.getElementById('eyebrow');
    var ORIG_TITLE = HERO ? HERO.textContent : 'Ren\'s Humble Abode';
    var defaultTitle = document.title || 'lmao you actually came';
    var witchTitleTimer;

    function fmtTime(d){
      let h = d.getHours(), m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      const mm = (m<10 ? '0' : '') + m;
      return `${h}:${mm} ${ampm}`;
    }
    function inWitchWindow(d){ return d.getHours() === 3 && d.getMinutes() < 30; }

    function enterWitch(){
      const current = document.documentElement.getAttribute('data-variant');
      if(current && current !== 'witch') return;

      document.documentElement.setAttribute('data-variant','witch');
      setLabelFromState();

      if (EYEBROW) EYEBROW.textContent = `it's currently ${fmtTime(new Date())}`;
      if (HERO)    HERO.textContent = 'THE WITCHING HOUR';

      if (typeof stopTypewriter === 'function') stopTypewriter();
      if (TYPE){
        TYPE.classList.add('no-caret');
        TYPE.textContent = `no, but seriously why would u open this site at ${fmtTime(new Date())}? go to sleep! maybe drink some water too.`;
      }

      // Enable CRT + global text glitch
      document.body.classList.add('crt-on');
      document.body.classList.add('glitch-on');

      // Creepy tab title flicker
      clearInterval(witchTitleTimer);
      document.title = "👁️ THE WITCHING HOUR 👁️";
      witchTitleTimer = setInterval(()=>{
        document.title = (document.title === "👁️ THE WITCHING HOUR 👁️")
          ? "IT'S 3AM... GO TO SLEEP"
          : "👁️ THE WITCHING HOUR 👁️";
      }, 4000);
    }

    function exitWitch(){
      if(document.documentElement.getAttribute('data-variant')!=='witch') return;
      document.documentElement.removeAttribute('data-variant');
      setLabelFromState();

      if (EYEBROW) EYEBROW.textContent = 'Introducing';
      if (HERO)    HERO.textContent = ORIG_TITLE;

      if (TYPE){
        TYPE.textContent = '';
        TYPE.classList.remove('no-caret');
      }
      if (typeof startTypewriter === 'function') startTypewriter();

      document.body.classList.remove('crt-on');
      document.body.classList.remove('glitch-on');
      clearInterval(witchTitleTimer);
      document.title = defaultTitle;
    }

    function checkWitchingHour(){
      const now = new Date();
      if (inWitchWindow(now)) enterWitch(); else exitWitch();
    }
    checkWitchingHour();
    setInterval(checkWitchingHour, 60_000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkWitchingHour(); });

    // ===== helpers =====
    function smoothVariantSwitch(apply){
      document.documentElement.classList.add('anim-colors');
      apply();
      setTimeout(function(){ document.documentElement.classList.remove('anim-colors'); }, 800);
    }
  } catch(err){ console.error('init error', err); }
}
