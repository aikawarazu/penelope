import type { Course } from '../types'

/**
 * 课程：草是怎么变成牛奶的？（场景动画课）
 *
 * 这类课不是「每步一张图」，而是**一幅连贯的大场景**：
 * 容器上加 st1…st7 状态类，由 CSS 驱动吃草、消化、血液快递、出奶、加热等动画，
 * 整节课是同一个连续的世界，而不是一堆风格不一的插画。
 *
 * 新增课程 = 在 courses/ 下新建这样一个文件，自动被发现，无需改任何注册表。
 */
const course: Course = {
  id: 'milk',
  title: '草是怎么变成牛奶的？',
  subtitle: '小朋友的奶牛小课堂',
  category: 'food',
  kind: 'scene',
  cover: '🥛',
  accent: '#6FB33F',
  order: 1,
  age: '3-6 岁',
  intro: '每天喝的那杯牛奶，最开始是一片绿绿的草。点一下「播放」，边听边看，跟着小奶牛走一圈。',
  scene: {
    viewBox: '0 0 1200 560',
    flag: '示意动画',
    doneBadge: { title: '牛奶做好啦！', sub: '草 → 牛奶，完成！' },
    svg: `
    <svg viewBox="0 0 1200 560" role="img" aria-label="奶牛吃草、营养进血液、乳房变牛奶的过程示意图">
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#C9E9FB"/><stop offset="1" stop-color="#EFF9FF"/>
        </linearGradient>
        <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ACB52"/><stop offset="1" stop-color="#69AE3B"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="560" fill="url(#skyG)"/>

      <!-- 太阳 -->
      <g id="sun">
        <circle cx="1062" cy="90" r="60" fill="#FFE9B0" opacity="0.55"/>
        <circle cx="1062" cy="90" r="44" fill="#FFD34D" stroke="#F5B93E" stroke-width="4"/>
      </g>

      <!-- 云 -->
      <g class="cloud">
        <ellipse cx="170" cy="92" rx="54" ry="23" fill="#FFFFFF" opacity="0.95"/>
        <ellipse cx="138" cy="84" rx="34" ry="17" fill="#FFFFFF" opacity="0.95"/>
        <ellipse cx="206" cy="84" rx="36" ry="18" fill="#FFFFFF" opacity="0.95"/>
      </g>
      <g class="cloud">
        <ellipse cx="705" cy="60" rx="48" ry="20" fill="#FFFFFF" opacity="0.9"/>
        <ellipse cx="672" cy="54" rx="30" ry="15" fill="#FFFFFF" opacity="0.9"/>
        <ellipse cx="738" cy="54" rx="32" ry="16" fill="#FFFFFF" opacity="0.9"/>
      </g>
      <g class="cloud">
        <ellipse cx="945" cy="158" rx="40" ry="16" fill="#FFFFFF" opacity="0.85"/>
        <ellipse cx="918" cy="152" rx="26" ry="13" fill="#FFFFFF" opacity="0.85"/>
        <ellipse cx="974" cy="152" rx="27" ry="13" fill="#FFFFFF" opacity="0.85"/>
      </g>

      <!-- 草地 -->
      <path d="M0,428 C200,414 470,414 700,427 C940,440 1080,419 1200,431 L1200,560 L0,560 Z" fill="url(#hillG)"/>
      <path d="M0,470 C320,456 780,474 1200,458 L1200,560 L0,560 Z" fill="#A5D67A" opacity="0.55"/>
      <g id="flowers">
        <circle cx="96" cy="452" r="5" fill="#FFF"/><circle cx="96" cy="452" r="2.6" fill="#FFC94D"/>
        <circle cx="430" cy="468" r="5" fill="#FFE3EE"/><circle cx="430" cy="468" r="2.6" fill="#F6A8BC"/>
        <circle cx="930" cy="466" r="5" fill="#FFF"/><circle cx="930" cy="466" r="2.6" fill="#FFC94D"/>
        <circle cx="1120" cy="472" r="5" fill="#FFE3EE"/><circle cx="1120" cy="472" r="2.6" fill="#F6A8BC"/>
      </g>

      <!-- 左边的草 -->
      <g id="grassCluster">
        <path class="blade" d="M150,424 Q142,394 150,366" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M172,424 Q166,388 172,352" stroke="#37974A" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M196,424 Q190,398 197,374" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M222,424 Q215,386 222,348" stroke="#37974A" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M248,424 Q242,396 249,370" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M274,424 Q267,390 274,356" stroke="#37974A" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="blade" d="M298,424 Q292,400 299,378" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <circle cx="262" cy="412" r="4.5" fill="#FFE3EE"/><circle cx="262" cy="412" r="2.2" fill="#F6A8BC"/>
      </g>

      <!-- 嘴边正在吃的草 -->
      <g id="mouthGrass">
        <path d="M352,424 Q347,400 353,384" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M372,424 Q367,394 373,376" stroke="#37974A" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M392,424 Q388,402 393,388" stroke="#2E8B3C" stroke-width="7" fill="none" stroke-linecap="round"/>
      </g>

      <!-- 飞向嘴巴的草屑 -->
      <g id="bits">
        <circle cx="368" cy="392" r="6" fill="#4EA53C"/>
        <circle cx="380" cy="402" r="5" fill="#5FB24A"/>
        <circle cx="358" cy="404" r="5" fill="#3F8F31"/>
      </g>

      <!-- 奶牛 -->
      <g id="cow">
        <g id="tail">
          <path d="M806,300 C848,316 866,348 852,384" stroke="#3A3A3F" stroke-width="9" fill="none" stroke-linecap="round"/>
          <ellipse cx="851" cy="394" rx="13" ry="18" fill="#3A3A3F"/>
        </g>
        <g id="legs">
          <rect x="522" y="412" width="34" height="44" rx="12" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <rect x="586" y="412" width="34" height="44" rx="12" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <rect x="714" y="412" width="34" height="44" rx="12" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <rect x="778" y="412" width="34" height="44" rx="12" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <rect x="522" y="448" width="34" height="12" rx="6" fill="#3A3A3F"/>
          <rect x="586" y="448" width="34" height="12" rx="6" fill="#3A3A3F"/>
          <rect x="714" y="448" width="34" height="12" rx="6" fill="#3A3A3F"/>
          <rect x="778" y="448" width="34" height="12" rx="6" fill="#3A3A3F"/>
        </g>
        <ellipse cx="660" cy="350" rx="195" ry="105" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
        <ellipse cx="770" cy="300" rx="52" ry="42" fill="#3A3A3F" transform="rotate(-14 770 300)"/>
        <ellipse cx="628" cy="258" rx="38" ry="26" fill="#3A3A3F"/>
        <ellipse cx="556" cy="330" rx="26" ry="20" fill="#3A3A3F"/>
        <rect x="548" y="250" width="60" height="92" rx="26" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
        <g id="head">
          <ellipse cx="486" cy="238" rx="17" ry="11" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <ellipse cx="524" cy="236" rx="17" ry="11" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <path d="M466,246 C458,222 462,204 482,202 C472,216 476,232 476,246 Z" fill="#E9B96A" stroke="#C8944A" stroke-width="3"/>
          <path d="M516,244 C510,220 518,204 538,206 C526,220 528,234 528,244 Z" fill="#E9B96A" stroke="#C8944A" stroke-width="3"/>
          <ellipse cx="505" cy="290" rx="62" ry="50" fill="#FFFFFF" stroke="#3A3A3F" stroke-width="4"/>
          <circle cx="474" cy="298" r="9" fill="#FFC9D4" opacity="0.85"/>
          <path d="M496,276 Q505,285 514,276" stroke="#3A3A3F" stroke-width="4" fill="none" stroke-linecap="round"/>
          <ellipse cx="447" cy="302" rx="30" ry="22" fill="#F7C9D6" stroke="#3A3A3F" stroke-width="3.5"/>
          <circle cx="436" cy="306" r="3.6" fill="#C96A7E"/>
          <path d="M436,314 Q447,320 458,314" stroke="#C96A7E" stroke-width="3" fill="none" stroke-linecap="round"/>
          <g id="jaw">
            <path d="M422,310 Q447,332 472,310 Q447,322 422,310 Z" fill="#F7C9D6" stroke="#3A3A3F" stroke-width="3.5" stroke-linejoin="round"/>
          </g>
        </g>
      </g>

      <!-- 大肚子（剖面） -->
      <ellipse id="tummy" cx="655" cy="358" rx="100" ry="72" fill="#FFF4F6" stroke="#F2A6BA" stroke-width="5" stroke-dasharray="11 8"/>
      <circle class="bubble" cx="632" cy="372" r="8" fill="none" stroke="#F2A6BA" stroke-width="3"/>
      <circle class="bubble" cx="668" cy="382" r="10" fill="none" stroke="#F2A6BA" stroke-width="3"/>
      <circle class="bubble" cx="694" cy="366" r="7" fill="none" stroke="#F2A6BA" stroke-width="3"/>
      <circle class="microbe" cx="628" cy="378" r="9" fill="#8BD450"/>
      <circle class="microbe" cx="662" cy="388" r="8" fill="#FFB74D"/>
      <circle class="microbe" cx="692" cy="380" r="9" fill="#7FC8E8"/>
      <circle class="microbe" cx="650" cy="366" r="7" fill="#E898D0"/>

      <!-- 血液快递 -->
      <path id="bloodline" class="bloodline" d="M620,312 C630,272 690,252 760,272 C808,290 818,330 812,366" fill="none" stroke="#E86A6A" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>
      <polygon points="806,358 818,358 812,372" fill="#E86A6A"/>
      <g id="dots">
        <circle class="dot" cx="620" cy="312" r="7.5" fill="#FFC94D" stroke="#E8A200" stroke-width="2" style="animation-delay:0s"/>
        <circle class="dot" cx="620" cy="312" r="7.5" fill="#FFC94D" stroke="#E8A200" stroke-width="2" style="animation-delay:-.9s"/>
        <circle class="dot" cx="620" cy="312" r="7.5" fill="#FFC94D" stroke="#E8A200" stroke-width="2" style="animation-delay:-1.8s"/>
        <circle class="dot" cx="620" cy="312" r="7.5" fill="#FFC94D" stroke="#E8A200" stroke-width="2" style="animation-delay:-2.7s"/>
        <circle class="dot" cx="620" cy="312" r="7.5" fill="#FFC94D" stroke="#E8A200" stroke-width="2" style="animation-delay:-3.6s"/>
      </g>

      <!-- 乳房 -->
      <g id="udder">
        <ellipse cx="806" cy="388" rx="40" ry="28" fill="#F6A8BC" stroke="#D9788F" stroke-width="3.5"/>
        <rect x="790" y="408" width="12" height="22" rx="6" fill="#F28FA5" stroke="#D9788F" stroke-width="2.5"/>
        <rect x="806" y="410" width="12" height="24" rx="6" fill="#F28FA5" stroke="#D9788F" stroke-width="2.5"/>
        <rect x="822" y="408" width="12" height="22" rx="6" fill="#F28FA5" stroke="#D9788F" stroke-width="2.5"/>
      </g>

      <!-- 杀菌：加热炉（仅第6步显示） -->
      <g id="heater">
        <rect x="762" y="524" width="124" height="12" rx="6" fill="#E8843C"/>
        <rect x="766" y="518" width="116" height="6" rx="3" fill="#FFB23C"/>
        <path class="flame" d="M748,516 C744,506 756,500 756,492 C764,500 762,512 754,516 Z" fill="#FF8A3C"/>
        <path class="flame" d="M760,516 C757,508 768,502 768,495 C775,502 774,512 766,516 Z" fill="#FFB23C"/>
      </g>

      <!-- 牛奶流进杯子 -->
      <path id="stream" d="M812,430 C810,442 806,448 802,456" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      <g id="glass">
        <path d="M770,456 h104 a14,14 0 0 1 14,14 v40 a14,14 0 0 1 -14,14 h-104 a14,14 0 0 1 -14,-14 v-40 a14,14 0 0 1 14,-14 Z" fill="#EFF9FF" stroke="#5FB3DF" stroke-width="5"/>
        <rect id="milkFill" x="778" y="468" width="88" height="50" rx="9" fill="#FFFFFF"/>
        <ellipse id="milkTop" cx="822" cy="468" rx="40" ry="6" fill="#FFFFFF"/>
        <rect x="846" y="428" width="12" height="58" rx="6" fill="#FFC94D" transform="rotate(9 852 457)"/>
        <g id="sparkles">
          <path class="spark" d="M912,436 l4,8 l8,4 l-8,4 l-4,8 l-4,-8 l-8,-4 l8,-4 Z" fill="#FFC94D"/>
          <path class="spark" d="M938,462 l3,6 l6,3 l-6,3 l-3,6 l-3,-6 l-6,-3 l6,-3 Z" fill="#FFE29A"/>
          <path class="spark" d="M884,448 l3,6 l6,3 l-6,3 l-3,6 l-3,-6 l-6,-3 l6,-3 Z" fill="#FFE29A"/>
        </g>
      </g>

      <!-- 杀菌：蒸汽 + 温度计（仅第6步显示） -->
      <g id="steam">
        <path class="puff" d="M792,446 q-6,-9 0,-17 q6,-9 0,-17" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="puff" d="M812,446 q-6,-9 0,-17 q6,-9 0,-17" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="puff" d="M830,446 q-6,-9 0,-17 q6,-9 0,-17" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g id="thermo">
        <rect x="830" y="470" width="7" height="38" rx="3.5" fill="#FFFFFF" stroke="#C96A7E" stroke-width="2"/>
        <rect x="832" y="474" width="3" height="26" rx="1.5" fill="#E86A6A"/>
        <circle cx="833.5" cy="513" r="5" fill="#E86A6A"/>
      </g>

      <!-- 小标签 -->
      <g class="pill"><rect x="168" y="330" width="84" height="32" rx="16" fill="#FFFFFF" opacity="0.95"/><text x="210" y="351" text-anchor="middle" class="pill-t">小草</text></g>
      <g class="pill"><rect x="598" y="290" width="112" height="34" rx="17" fill="#FFFFFF" opacity="0.95"/><text x="654" y="312" text-anchor="middle" class="pill-t">大肚子</text></g>
      <g class="pill"><rect x="646" y="252" width="120" height="34" rx="17" fill="#FFFFFF" opacity="0.95"/><text x="706" y="274" text-anchor="middle" class="pill-t">血液快递</text></g>
      <g class="pill"><rect x="832" y="356" width="88" height="34" rx="17" fill="#FFFFFF" opacity="0.95"/><text x="876" y="378" text-anchor="middle" class="pill-t">乳房</text></g>
      <g class="pill"><rect x="786" y="538" width="76" height="32" rx="16" fill="#FFFFFF" opacity="0.95"/><text x="824" y="559" text-anchor="middle" class="pill-t">牛奶</text></g>
    </svg>
    `,
    css: `
.done-badge{
  position:absolute;left:4.5%;top:10%;z-index:2;
  background:#FFF;border:3px solid var(--green);border-radius:18px;
  padding:10px 18px;text-align:center;
  opacity:0;transform:scale(.5);pointer-events:none;
  box-shadow:0 6px 16px rgba(80,120,60,.18);
}
.scene.st7 .done-badge{opacity:1;transform:scale(1);transition:all .5s cubic-bezier(.22,1,.36,1)}
.done-badge b{display:block;font-family:'ZCOOL KuaiLe','Noto Sans SC',sans-serif;font-size:clamp(20px,3.4vw,27px);color:#3E7A2B}
.done-badge span{font-size:13px;color:var(--sub)}
.pill-t{font-family:'ZCOOL KuaiLe','Noto Sans SC','PingFang SC',sans-serif;font-size:19px;fill:#33503F}
/* ===== 场景动画 ===== */
.blade{animation:sway 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.4deg)}}
.cloud{animation:drift 30s ease-in-out infinite}
@keyframes drift{0%,100%{transform:translateX(0)}50%{transform:translateX(24px)}}
#sun{animation:sunPulse 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes sunPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.scene.paused .blade,.scene.paused .cloud,.scene.paused #sun{animation-play-state:paused}

/* 第2步：吃草 */
.scene.st2 #head{animation:headTilt 2.4s ease-in-out infinite;transform-box:view-box;transform-origin:560px 340px}
@keyframes headTilt{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}
.scene.st2 #jaw{animation:chew .5s ease-in-out infinite;transform-box:view-box;transform-origin:455px 318px}
@keyframes chew{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(5deg)}}
.scene.st2 #mouthGrass{animation:eatGrass 4.6s cubic-bezier(.5,0,.7,1) forwards;transform-box:fill-box;transform-origin:bottom center}
@keyframes eatGrass{0%{transform:scaleY(1)}100%{transform:scaleY(.08)}}
#bits{opacity:0}
.scene.st2 #bits{opacity:1}
.scene.st2 #bits circle{animation:flyBit 1.3s ease-in forwards;transform-box:fill-box}
#bits circle:nth-child(1){animation-delay:.35s}
#bits circle:nth-child(2){animation-delay:1.05s}
#bits circle:nth-child(3){animation-delay:1.7s}
@keyframes flyBit{
  0%{transform:translate(0,0);opacity:1}
  75%{opacity:1}
  100%{transform:translate(82px,-96px);opacity:0}
}

/* 第3步：大肚子 */
.scene.st3 #tummy{animation:tummyWiggle 1s ease-in-out infinite;transform-box:view-box;transform-origin:655px 358px}
@keyframes tummyWiggle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97)}}
.bubble{opacity:0;transform-box:fill-box;transform-origin:center}
.scene.st3 .bubble{animation:bubbleUp 1.9s ease-in infinite}
@keyframes bubbleUp{
  0%{transform:translateY(0);opacity:0}
  20%{opacity:.9}
  100%{transform:translateY(-54px);opacity:0}
}
.scene.st3 .microbe{animation:microbeHop .7s ease-in-out infinite;transform-box:fill-box}
@keyframes microbeHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.scene.st3 .microbe:nth-child(2){animation-delay:.15s}
.scene.st3 .microbe:nth-child(3){animation-delay:.3s}
.scene.st3 .microbe:nth-child(4){animation-delay:.45s}

/* 第4、5步：血液快递 + 营养dots */
.scene.st4 #tummy{filter:drop-shadow(0 0 10px rgba(255,201,77,.85))}
.scene.st4 .bloodline,.scene.st5 .bloodline{animation:flow 1.1s linear infinite}
@keyframes flow{to{stroke-dashoffset:-96}}
#dots{opacity:0}
.scene.st4 #dots,.scene.st5 #dots{opacity:1}
.scene.st4 .dot,.scene.st5 .dot{
  animation:dotTravel 4.4s linear infinite;
  offset-path:path('M620,312 C630,272 690,252 760,272 C808,290 818,330 812,366');
  offset-rotate:0deg;
}
@keyframes dotTravel{0%{offset-distance:0%}100%{offset-distance:100%}}

/* 第5、6步：乳房出奶 */
.scene.st5 #udder,.scene.st6 #udder{animation:udderPulse .9s ease-in-out infinite;transform-box:view-box;transform-origin:806px 416px}
@keyframes udderPulse{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,1.1)}}
#milkFill{transform-box:fill-box;transform-origin:bottom center;transform:scaleY(0);transition:transform 2.2s cubic-bezier(.22,1,.36,1)}
#stream{stroke-dasharray:52 52;stroke-dashoffset:52;transition:stroke-dashoffset 1.4s ease}
.scene.st7 #milkTop{animation:milkRipple 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes milkRipple{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.12)}}
.scene.st7 #tail{animation:wag .8s ease-in-out infinite;transform-box:view-box;transform-origin:806px 300px}
@keyframes wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}
.spark{opacity:0}
.scene.st7 .spark{animation:twinkle 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.spark:nth-child(2){animation-delay:.4s}
.spark:nth-child(3){animation-delay:.8s}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}

/* 第6步：加热杀菌 */
#heater,#thermo{display:none}
#steam{opacity:0}
.scene.st6 #heater{display:block}
.scene.st6 #thermo{display:block}
.scene.st6 #steam{opacity:1}
.scene.st6 .flame{animation:flicker .5s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@keyframes flicker{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.14) rotate(3deg)}}
.scene.st6 .flame:nth-child(2){animation-delay:.2s}
.scene.st6 .puff{animation:steamRise 1.8s ease-in infinite;transform-box:fill-box}
@keyframes steamRise{
  0%{transform:translateY(0) scale(.85);opacity:0}
  25%{opacity:.9}
  100%{transform:translateY(-36px) scale(1.12);opacity:0}
}
.scene.st6 .puff:nth-child(2){animation-delay:.6s}
.scene.st6 .puff:nth-child(3){animation-delay:1.2s}

@media (max-width:680px){
  .facts-grid{grid-template-columns:1fr}
  .caption{flex-wrap:wrap}
}
@media (prefers-reduced-motion: reduce){
  *{animation:none !important;transition:none !important}
    `
  },
  steps: [
    {
      id: 'grow',
      title: '草在牧场里长大',
      text: '太阳晒一晒，雨水浇一浇，小草绿油油地长高了。',
      dur: 6900
    },
    {
      id: 'chew',
      title: '奶牛吃草啦',
      text: '奶牛“咔嚓咔嚓”把草嚼碎，一口一口吞进肚子。',
      dur: 6600,
      pop: { text: '咔嚓咔嚓！', left: '23%', top: '23%' }
    },
    {
      id: 'tummy',
      title: '草来到大肚子',
      text: '草掉进“大肚子”里，微生物小帮手把它变成营养糊糊。',
      dur: 7500,
      pop: { text: '咕噜咕噜…', left: '42%', top: '52%' }
    },
    {
      id: 'blood',
      title: '营养坐上血液快递',
      text: '营养钻进血液里，跟着血液开始全身旅行。',
      dur: 6600
    },
    {
      id: 'milk',
      title: '牛奶流出来啦',
      text: '营养来到乳房，被加工成白白的牛奶，流进杯子里。',
      dur: 6300,
      pop: { text: '咕嘟咕嘟～', right: '10%', bottom: '16%' }
    },
    {
      id: 'heat',
      title: '加热杀菌',
      text: '牛奶要热一热，把坏细菌都杀掉，喝着才安全。',
      dur: 6600,
      pop: { text: '热乎乎～', right: '10%', bottom: '16%' }
    },
    {
      id: 'done',
      title: '牛奶做好啦！',
      text: '“哞——”杀菌后的牛奶又香又营养，放心喝吧！',
      dur: 7900
    }
  ],
  summary: '草 → 吃进肚子 → 微生物帮忙 → 坐上血液 → 变成牛奶 → 加热杀菌。原来每天那杯牛奶，走了这么远的路。',
  factsTitle: '你知道吗？四个小秘密',
  facts: [
    {
      icon: `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"> <circle cx="12" cy="26" r="8" fill="#8BD450" stroke="#5FA335" stroke-width="2"/> <circle cx="24" cy="15" r="8" fill="#FFB74D" stroke="#E8A200" stroke-width="2"/> <circle cx="36" cy="26" r="8" fill="#7FC8E8" stroke="#4A9FD0" stroke-width="2"/> <circle cx="24" cy="34" r="7" fill="#F6A8BC" stroke="#D9788F" stroke-width="2"/> <path d="M12,26 L36,26" stroke="#FFF" stroke-width="1.5" stroke-dasharray="2 3"/> </svg>`,
      title: '奶牛有四个胃',
      text: '草吃下去后，还会回到嘴里再嚼一遍，这叫“反刍”。所以草要被嚼两次！'
    },
    {
      icon: `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"> <path d="M24 8c6 8 12 15 12 24a12 12 0 1 1-24 0C12 23 18 16 24 8z" fill="#7FC8E8" stroke="#4A9FD0" stroke-width="2"/> </svg>`,
      title: '牛奶大部分是水',
      text: '牛奶里大约 87% 都是水。为了产奶，奶牛每天要喝好多好多水。'
    },
    {
      icon: `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"> <circle cx="24" cy="24" r="14" fill="none" stroke="#8BD450" stroke-width="3" stroke-dasharray="5 4"/> <circle cx="18" cy="24" r="3" fill="#FFB74D"/> <circle cx="28" cy="18" r="3" fill="#7FC8E8"/> <circle cx="30" cy="30" r="3" fill="#F6A8BC"/> </svg>`,
      title: '微生物小帮手',
      text: '草里最硬的“纤维素”，靠奶牛肚子里的微生物帮忙分解成营养。'
    },
    {
      icon: `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"> <rect x="18" y="6" width="12" height="32" rx="6" fill="#FFFFFF" stroke="#C96A7E" stroke-width="2"/> <rect x="21" y="10" width="6" height="20" rx="3" fill="#E86A6A"/> <circle cx="24" cy="42" r="6" fill="#E86A6A"/> </svg>`,
      title: '牛奶要加热杀菌',
      text: '牛奶里有看不见的小细菌，要加热到 72°C 保持 15 秒（巴氏杀菌），把它们杀掉才能放心喝。'
    }
  ],
  footer: '送给爱问问题的小朋友：牛奶是奶牛把草变成的营养，要多喝牛奶，长得高高的！'
}

export default course
