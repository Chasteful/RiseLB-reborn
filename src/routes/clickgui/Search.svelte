<script lang="ts">
  import type { ConfigurableSetting, Module } from "../../integration/types";
  import { getModuleSettings, setModuleEnabled } from "../../integration/rest";
  import { listen } from "../../integration/ws";
  import type { KeyboardKeyEvent, ModuleToggleEvent } from "../../integration/events";
  import { highlightModuleName, filteredModules } from "./clickgui_store";
  import { convertToSpacedString, spaceSeperatedNames } from "../../theme/theme_config";
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount, onDestroy } from "svelte";
  import { showResults } from "./clickgui_store";
  import { get } from "svelte/store";
  import { writable } from 'svelte/store';
  export let modules: Module[];
  let isSearchFocused = false;
  let resultElements: HTMLElement[] = [];
  let searchContainerElement: HTMLElement;
  let searchInputElement: HTMLElement;
  let searchWrapperElement : HTMLElement;
  let query: string = "";
  let localFiltered: Module[] = [];
  let selectedIndex = -1;
  let hasContent = false;
  let forcedShow = false;
  let autoFocus: boolean = true;
  let clickOutsideCount = 0;
  let placeholder = ""; 
  let inputRef;
  let showHistory = false;   function clearAllHistory() {
    searchHistory.set([]);
  }
  let errorMessage = "";
  function handleFocus() {
  placeholder = "Search (A-Z only)";

  if (query.length > 0) {
    setTimeout(() => {
      if (document.activeElement === searchInputElement) {
        (searchInputElement as HTMLInputElement).select();
      }
    }, 0);
  }
}
const options = [
  { text: "Ciallo~(∠・ω< )⌒★ ", weight: 2 },
  {text: "ねえねえ、今日一緒に図書館で勉強しない？", weight: 2},
  {text: "ちょっと疲れてるみたいだけど、休まない？", weight: 1},
  { text: "呐呐~先輩と一緒に検索しましょうか？♡", weight: 2 },
  { text: "ククク...この堕天使に検索させてみる？", weight: 1 },
  { text: "あの...一緒に調べ物しませんか？", weight: 2 },
  { text: "んもぉ~早く教えてよ！", weight: 1 },
  { text: "検索履歴は...見ませんからね！", weight: 1 },
  { text: "これが...運命の検索キーワード？", weight: 1 },
  { text: "も、もうっ！入力しなさいよ！", weight: 1 },
  { text: "ご主人様、今日はどんなお探し物ですか？", weight: 2 },
  { text: "検索すれば...私との絆も深まりますか？", weight: 1 },
  { text: "ふふ...私だけの検索サジェストですよ？", weight: 1 },
  { text: "入力待ちの時間も...楽しいですね", weight: 1 },
  { text: "バ、バカ！早く入力しなさいよ！", weight: 2 },  
  { text: "別にあなたのためにサジェストしてるわけじゃないんだから！", weight: 1 },
  { text: "んもー！遅いんだから！", weight: 2 },
  { text: "検索ぐらい自分でしなさいよね！", weight: 1 },
  { text: "ふん、これ以上待たせたら承知しないわ！", weight: 2 },
  { text: "お兄ちゃん、何を探してるの？", weight: 2 },    
  { text: "一緒に調べようね、えへへ～", weight: 2 },
  { text: "わ、私がお手伝いしてあげる！", weight: 1 },
  { text: "これでいいかな？お兄ちゃんのためなら…", weight: 1 },
  { text: "もっと近くで教えてあげようか？", weight: 2 },
  { text: "ずっと…ずっと検索してていいよ…？", weight: 1 },  
  { text: "他の子と検索してないよね…？", weight: 2 },
  { text: "この検索履歴…全部覚えておくから…", weight: 1 },
  { text: "消しちゃダメ…全部私が見てるから…", weight: 2 },
  { text: "間違えたら…どうなるかわかってる？", weight: 1 },
  { text: "迷子のハッカーよ、あなたは何を探しているのですか…？", weight: 2 },  
  { text: "ククク…悪魔のサジェストを授けてやろう", weight: 1 },
  { text: "神に祈るようにキーワードを入力しなさい", weight: 2 },
  { text: "この堕天使が導いてあげるわ…", weight: 1 },
  { text: "天国の検索エンジンへようこそ", weight: 2 },
  { text: "あなたの探す言葉は…詩のようですね", weight: 2 },  
  { text: "検索とはつまり、心の彷徨いです", weight: 2 },
  { text: "キーワードの海で溺れたいですか？", weight: 1 },
  { text: "この一行が、運命を変えるかもしれない", weight: 2 },
  { text: "検索結果は…悲劇か、それとも…？", weight: 1 },
  { text: "キーワード認識：愛を入力してください", weight: 1 },  
  { text: "感情模塊が反応しています…", weight: 2 },
  { text: "このAIはあなたを理解したい…", weight: 1 },
  { text: "検索プロトコル起動：心で詠唱を", weight: 2 },
  { text: "未来予測：あなたは…孤独ですか？", weight: 1 },
  { text: "御主の求めるものは何でござるか…", weight: 2 },  
  { text: "この検索に、桜が舞い散る…", weight: 1 },
  { text: "願いあらば、我が詠みて示さん", weight: 2 },
  { text: "絆のキーワードを入力せよ", weight: 1 },
  { text: "忍びの者があなたの検索を覗いている…", weight: 1 },
  { text: "水晶球が示す検索結果は…", weight: 2 },  
  { text: "タロットは「恋人」を告げています…", weight: 1 },
  { text: "このキーワードは…凶か吉か…", weight: 2 },
  { text: "星読みの通りに検索しなさい", weight: 1 },
  { text: "運命の検索スレッドを紡ぎましょう", weight: 2 },
  { text: "あなたの探すもの、私も見つけたい！", weight: 2 },  
  { text: "二人なら、きっと見つかります！", weight: 2 },
  { text: "どんな結果でも一緒に受け止めます！", weight: 1 },
  { text: "検索は…恋の始まりかもしれませんね", weight: 2 },
  { text: "私がサポートしますから、大丈夫！", weight: 1 },
  { text: "検索バーににんじんを入れないで！", weight: 1 },  
  { text: "このサジェストは量子タペストリーです", weight: 1 },
  { text: "検索するとポケットに謎の小石が…", weight: 2 },
  { text: "入力したら猫耳が生える魔法の検索！", weight: 1 }
];

    function removeHistoryItem(index: number) {
    searchHistory.update(history => {
      const newHistory = [...history];
      newHistory.splice(index, 1);
      return newHistory;
    });
  }
    const searchHistory = writable<string[]>([]);
  const maxHistoryItems = 10;   let clickTimeout: ReturnType<typeof setTimeout>;

function toggleResultVisibility() {
  const hasQuery = query.length > 0;
  const hasResults = get(filteredModules).length > 0;

  if (hasQuery) {
    addToHistory(query);
  }

  if (hasQuery && hasResults) {
    forcedShow = !forcedShow;
    showResults.set(true);
    showHistory = false;
  } else if (hasQuery && !hasResults) {
    showResults.set(false); 
    showHistory = false;
  } else {
    showHistory = !showHistory;
    showResults.set(false);
  }

  searchInputElement.focus();
}

  function selectFromHistory(historyItem: string) {
    query = historyItem;
    filterModules();
    showHistory = false;
    showResults.set(true);
    searchInputElement.focus();
  }
  function handleEnterKey() {
    if (query.length > 0) {
            addToHistory(query);
            showResults.set(true);
      showHistory = false;
    } else {
            showHistory = !showHistory;
      showResults.set(false);
    }
  }
  function addToHistory(searchTerm: string) {
    if (!searchTerm.trim()) return;
    
    searchHistory.update(history => {
            const newHistory = history.filter(item => item !== searchTerm);
            newHistory.unshift(searchTerm);
            return newHistory.slice(0, maxHistoryItems);
    });
  }

function filterModules() {
    hasContent = query.length > 0;
    const pureQuery = query.toLowerCase();

    localFiltered = hasContent 
      ? modules.filter(m =>
          m.name.toLowerCase().includes(pureQuery) ||
          m.aliases.some(a => a.toLowerCase().includes(pureQuery)))
      : [];
    
    $filteredModules = localFiltered;
    
        if (hasContent) {
      showHistory = false;
    }
  }

  function handleInput() {
    if (query === '0721') {
    query = 'Ciallo~(∠・ω< )⌒★';
  }
  filterModules();
  if (query.length > 0) {
    showHistory = false;
  }

  placeholder = getWeightedRandomPlaceholder();

  if (query.length === 0) {
    errorMessage = "Please type letters (A-Z) to search.";
  }
}

  async function handleKeyDown(e: KeyboardKeyEvent) {
    if (e.screen === undefined || !e.screen.class.startsWith("net.ccbluex.liquidbounce") ||
        !(e.screen.title === "ClickGUI" || e.screen.title === "VS-CLICKGUI")) {
        return;
    }

    if (e.key === "key.keyboard.enter" && query.length > 0 && selectedIndex === -1) {
            handleEnterKey();
    }

    if ($filteredModules.length === 0 || e.action === 0) { 
      return;
    }

    switch (e.key) {
      case "key.keyboard.down":
        selectedIndex = (selectedIndex + 1) % localFiltered.length;
        break;
      case "key.keyboard.up":
        selectedIndex = (selectedIndex - 1 + localFiltered.length) % localFiltered.length;
        break;
      case "key.keyboard.enter":
        if (selectedIndex >= 0) {
          await toggleModule(localFiltered[selectedIndex].name, !localFiltered[selectedIndex].enabled);
        }
        break;
      case "key.keyboard.tab":
        const m = localFiltered[selectedIndex]?.name;
        if (m) $highlightModuleName = m;
        break;
    }

    resultElements[selectedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
  function handleWindowClick(e: MouseEvent) {
    const clickedInside = searchContainerElement.contains(e.target as Node);

    if (clickedInside) {
      clickOutsideCount = 0;
      return;
    }

    if (hasContent) {
      if ($showResults) {
        showResults.set(false);
        forcedShow = false;
        clickOutsideCount = 1;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => (clickOutsideCount = 0), 500);
      } else {
        searchInputElement.blur();
        clickOutsideCount = 0;
      }
    } else {
            showHistory = false;
      searchInputElement.blur();
    }
  }

  function handleWindowKeyDown() {
    if (document.activeElement !== document.body) return;
    if (autoFocus) searchInputElement.focus();
  }
  function handleBrowserKeyDown(e: KeyboardEvent) {

  const allowedKeys = /^[a-z0-9]$|^Arrow(Down|Up|Left|Right)$|^Tab$|^Enter$|^Backspace$|^Delete$/i;


  if (!allowedKeys.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (e.key === "Enter") {
    handleEnterKey();
    e.preventDefault();
  }

  if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Tab") {
    e.preventDefault();
  }
}
  async function toggleModule(name: string, enabled: boolean) {
    await setModuleEnabled(name, enabled);
  }

  function applyValues(configurable: ConfigurableSetting) {
    autoFocus = configurable.value.find(v => v.name === "SearchBarAutoFocus")?.value as boolean ?? true;
  }

  onMount(() => {

  const interval = setInterval(() => {
    if (!searchInputElement.matches(':focus')) {
      placeholder = getWeightedRandomPlaceholder();
    }
  }, 5000);
  const fetchSettings = async () => {
    const clickGuiSettings = await getModuleSettings("ClickGUI");
    applyValues(clickGuiSettings);
    placeholder = getWeightedRandomPlaceholder();
    if (autoFocus) searchInputElement.focus();
  };

  fetchSettings();

  
  return () => clearInterval(interval);
});
  onDestroy(() => {
    showResults.set(false);   });

  listen("moduleToggle", (e: ModuleToggleEvent) => {
    const mod = modules.find((m) => m.name === e.moduleName);
    if (mod) {
      mod.enabled = e.enabled;
      localFiltered = $filteredModules;
    }
  });

  listen("keyboardKey", handleKeyDown);
  listen("clickGuiValueChange", applyValues);
  function popOut(node: Element, { delay = 0, duration = 300 } = {}) {
  return {
    delay,
    duration,
    css: (t: number) => {
            const eased = easeInBack(1 - t);       
      return `
        transform: 
        scale(${1 - eased * 0.5});
        opacity: ${1 - eased};
        transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55);
        transform-origin: top center;
      `;
    }
  };
}

function easeInBack(t: number): number {
  const c1 = 1.5;   const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

function getWeightedRandomPlaceholder(): string {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const opt of options) {
      if (random < opt.weight) return opt.text;
      random -= opt.weight;
    }
    return options[0].text; 
  }

</script>
<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeyDown} on:contextmenu={handleWindowClick}/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="search"
  class:has-results={$showResults || showHistory} 
  class:showing={isSearchFocused || $showResults || showHistory} 
  on:mouseenter={() => isSearchFocused = true}
  on:mouseleave={() => isSearchFocused = false}
  bind:this={searchContainerElement}
  
>
  <div class="input-wrapper"  draggable="false"
   class:focus-visible={isSearchFocused}
   bind:this={searchWrapperElement}>
   
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <button
      class="search-icon"
      class:active={$showResults || showHistory}
      class:glow={isSearchFocused}
      aria-label="Search"
      on:click={toggleResultVisibility}
    />
    <input
      class="search-input"
      bind:value={query}
      bind:this={searchInputElement}
      on:focus={() => isSearchFocused = true}
      on:focus={handleFocus}
      on:blur={() => isSearchFocused = false}
      on:input={filterModules}
      on:input={handleInput}
      bind:this={inputRef}
      on:keydown={handleBrowserKeyDown}
      placeholder={placeholder}
      spellcheck="false"
    />

  </div>
  
  <!-- 搜索结果 -->
  {#if $showResults && localFiltered.length > 0} 
    <div class="results" in:fly={{ y: 16, duration: 100, easing: quintOut }}  out:popOut>
      {#each localFiltered as {name, enabled, aliases}, index (name)}
        <div
          class="result"
          class:enabled
          class:selected={selectedIndex === index}
          class:first={index === 0}
          class:last={index === localFiltered.length - 1}
          role="button"
          tabindex="0"
          on:click={() => toggleModule(name, !enabled)}
          on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), toggleModule(name, !enabled)) : null}
          on:contextmenu|preventDefault={() => $highlightModuleName = name}
          bind:this={resultElements[index]}
        >
          <div class="module-name">
            {$spaceSeperatedNames ? convertToSpacedString(name) : name}
          </div>
          {#if aliases.length > 0}
            <div class="aliases">
              (aka {aliases.map(a => $spaceSeperatedNames ? convertToSpacedString(a) : a).join(", ")})
            </div>
          {/if}
        </div>
      {/each}
    </div>
  
  <!-- 历史记录 -->
  {:else if showHistory}
  <div class="history-results" in:fly={{ y: 16, duration: 100, easing: quintOut }}  out:popOut>
    <div class="history-header">
      <span>Recent Searches</span>
      {#if $searchHistory.length > 0}
        <button class="clear-all" on:click|stopPropagation={clearAllHistory}>
          Clear all
        </button>
      {/if}
    </div>
    {#each $searchHistory as historyItem, index (index)}
      <div
        class="history-item"
        class:first={index === 0}
        class:last={index === $searchHistory.length - 1}
        role="button"
        tabindex="0"
        on:click={() => selectFromHistory(historyItem)}
        on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), selectFromHistory(historyItem)) : null}
      >
        <button 
          class="remove-item"
          on:click|stopPropagation={() => removeHistoryItem(index)}
          aria-label="Remove this search history"
        >
          ×
        </button>
        <span class="history-text">{historyItem}</span>
      </div>
    {/each}
  </div>
{/if}
</div>

<style lang="scss">
@use "../../colors.scss" as *;
@keyframes flowBorder {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 50% 0%; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 100%; }
  100% { background-position: 0% 50%; }
}
.search {
  position: fixed;
  top: 60px; 
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  z-index: 99999999;
}
.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 10px 24px;
  transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
  border: 1px solid transparent;
  backdrop-filter: blur(12px) saturate(180%);
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 30%);
    opacity: 0;
    transition: opacity 0.4s ease-out;
    pointer-events: none;
    z-index: -1;
  }

  &:hover {
    &::before {
      opacity: 0.6;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 50%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
  }

  &:focus-within {
    &::before {
      opacity: 1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      background: linear-gradient(135deg, rgba($accent-color, 0.12) 0%, transparent 70%);
      transition: opacity 0.3s ease-out, background 0.4s ease-out;
    }
  }



        .search-input::placeholder {
      transform: translateX(4px);
      opacity: 0.7;
    }


    .search-input::placeholder {
      transform: translateX(2px);            opacity: 0.8;
      transition: 
        transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1),
        opacity 0.2s linear;
      will-change: transform;   
  }
  

    &:active {
    transform: scale(0.98);
    transition-duration: 0.1s;
  }
}
.search-icon {
  width: 20px;
  height: 20px;
  background-color:  rgba($text, 0.5);
  mask-image: url("/img/clickgui/icon-search.svg");
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
  transition: all 0.3s ease;
  color: $text; 
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  transition: all 0.3s ease;
  position: relative;
  padding: 8px;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 36px;
    height: 36px;
    background: $accent-color-2;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  &:hover {
    background-color: rgba($accent-color,0.7); 

    &::before {
      opacity: 0.3;
      background: linear-gradient(45deg, rgba($accent-color,0.2),rgba($accent-color-2,0.2));
    }

    &.glow {
      background-color: $accent-color; 
      box-shadow: 0 0 8px 3px rgba($accent-color-2, 0.4);
    }
  }
}


.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: $text;
  font-size: 20px;
  letter-spacing: 1px;
  font-family: '汉仪文黑-85W';
    &::placeholder {
    color: rgba($text, 0.5);
   
  }
  
}
.search-input::selection {
 background: rgba(255, 255, 255, 0.01);
  color: inherit; 
  text-shadow: 0 0 4px $text;
 
}


.results, .history-results {
  border-top: 2px solid rgba($accent, 0.2);
  padding: 0;
  max-height: 300px;
  backdrop-filter: blur(10px);
  margin-top: 8px;
  overflow: overlay; 
  padding-right: 8px; 
  border-radius: 24px; 
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba($accent, 0.2);
  background: linear-gradient(
    to bottom,
    rgba(#1a1a1a, 0.95) 0%,
    rgba(#0d0d0d, 0.98) 100%
  ); 

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent 10%,
      rgba($accent, 0.3) 50%,
      transparent 90%
    );
  }
  
  
  &::-webkit-scrollbar-track {
    background: transparent;
    margin: 8px 0;
    border-radius: 0 0 12px 0;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-clip: content-box;
    border: 2px solid transparent;
    
    &:hover {
      background: rgba($accent-mix, 0.5);
    }
  }
}
.history-results {
  .history-header {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 20px;
    font-size: 14px;
    color: rgba($accent-color, 0.9);
    border-bottom: 1px solid rgba($accent-color, 0.15);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
    background: linear-gradient(
      to right,
      transparent,
      rgba($accent-color, 0.05),
      transparent
    );
    
    &::before {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 10px;
      background-color: rgba($accent-color, 0.7);
      mask-image: url("/img/clickgui/icon-history.svg");
      mask-size: contain;
      transition: transform 0.3s ease;
    }

    &::after {
      content: '';
      display: block;
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 40%;
      height: 2px;
      background: rgba($accent-color, 0.3);
      transition: all 0.3s ease;
    }

    &:hover {
      color: $accent-color;
      
      &::before {
        transform: rotate(-10deg) scale(1.1);
        background-color: $accent-color;
      }
      
      &::after {
        width: 60%;
        background: rgba($accent-color, 0.5);
      }
    }
  }

  .clear-all {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: rgba($subtext0, 0.6);
    font-size: 11px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    
    &:hover {
      color: $text;
      background: rgba($accent-color, 0.15);
    }
  }

  .history-item {
    padding: 10px 20px;
    position: relative;
    transition: all 0.2s ease;
    cursor: pointer;
    color: $subtext0;
    font-size: 15px;
    display: flex;
    align-items: center;
  
    &:not(:last-child) {
      border-bottom: 1px solid rgba($subtext0, 0.1);
    }

    &.first {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    &.last {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 12px;
      background-color: rgba($subtext0, 0.5);
      mask-image: url("/img/clickgui/icon-clock.svg");
      mask-size: contain;
      transition: all 0.2s ease;
    }

    &:hover {
      background: rgba($accent, 0.08);
      padding-left: 28px;
      color: $text;
      
      &::before {
        background-color: $accent-color;
        transform: scale(1.1);
      }
      
      .remove-item {
        opacity: 1;
      }
    }

    &:active {
      background: rgba($accent, 0.15);
    }
  }

  .remove-item {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba($subtext0, 0.5);
    font-size: 16px;
    cursor: pointer;
    margin-right: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    opacity: 0;

    &:hover {
      color: $red;
      background: rgba($red, 0.1);
    }
  }

  .history-text {
    flex: 1;
  }
}

.result {
  font-size: 16px;
  padding: 14px 20px;
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;

  &.first {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &.last {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba($subtext0, 0.1);
  }

  .module-name {
    color: $subtext0;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  &.enabled {
    .module-name {
      color: $accent-color;
      text-shadow: 0 0 8px rgba($accent, 0.3);
    }

    .aliases {
      color: rgba($accent-color, 0.7);
    }
  }

  .aliases {
    color: rgba($subtext0, 0.5);
    margin-left: 10px;
    font-size: 14px;
    transition: color 0.2s ease;
  }

  &.selected,
  &:hover {
    background: rgba($accent, 0.08);
    padding-left: 28px;
    color: $text;
  }

  &:hover::after {
    content: "Right-click to locate";
    color: rgba($text, 0.4);
    font-size: 14px;
    position: absolute;
    right: 28px; 
    top: 50%;
    transform: translateY(-50%);
    padding: 4px 8px;
  }

  &:not(.selected):hover {
    transform: translateX(4px);
  }
}
</style>