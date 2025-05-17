document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded. Initializing script with ALL JSON toggles (v3).");

    // --- 基本的なDOM要素の取得 ---
    const dataFieldsContainer = document.getElementById('data-fields-container');
    const addDataFieldButton = document.getElementById('addDataField');
    const evaluateFilterButton = document.getElementById('evaluateButton');
    const conditionRoot = document.getElementById('condition-root'); // 条件設定UIのルートグループ
    const rootConditionsList = conditionRoot ? conditionRoot.querySelector('.conditions-list') : null;
    const rootAddConditionButton = conditionRoot ? conditionRoot.querySelector('.add-condition-button') : null;
    const rootAddGroupButton = conditionRoot ? conditionRoot.querySelector('.add-group-button') : null;
    
    // --- データ定義JSONモード関連のDOM要素 ---
    const toggleDataJsonModeButton = document.getElementById('toggleDataJsonModeButton');
    const dataFieldsUiContainer = document.getElementById('data-fields-ui-container'); 
    const dataJsonEditorContainer = document.getElementById('data-json-editor-container'); 
    const dataDefinitionJsonTextarea = document.getElementById('dataDefinitionJsonTextarea');
    const dataJsonErrorDisplay = document.getElementById('dataJsonErrorDisplay');

    // --- ★条件設定JSONモード関連のDOM要素 (新規追加) ---
    const toggleConditionsJsonModeButton = document.getElementById('toggleConditionsJsonModeButton');
    const conditionBuilderUiContainer = document.getElementById('condition-builder-ui-container');
    const conditionsJsonEditorContainer = document.getElementById('conditions-json-editor-container');
    const conditionSettingsJsonTextarea = document.getElementById('conditionSettingsJsonTextarea');
    const conditionsJsonErrorDisplay = document.getElementById('conditionsJsonErrorDisplay');

    // --- 状態変数 ---
    let availableDataFields = []; 
    let isDataJsonMode = false;   
    let lastGoodDataDefinitionObject = []; 
    let isConditionsJsonMode = false; // ★新規追加
    let lastGoodConditionsObject = null; // ★新規追加 (初期値は後ほど設定)

    // --- エラーチェック: 重要なDOM要素が存在するか ---
    if (!dataFieldsContainer || !addDataFieldButton || !evaluateFilterButton || !conditionRoot ||
        !toggleDataJsonModeButton || !dataFieldsUiContainer || !dataJsonEditorContainer || 
        !dataDefinitionJsonTextarea || !dataJsonErrorDisplay ||
        !toggleConditionsJsonModeButton || !conditionBuilderUiContainer || !conditionsJsonEditorContainer ||
        !conditionSettingsJsonTextarea || !conditionsJsonErrorDisplay
        ) {
        console.error("初期化エラー: 必須HTML要素のいずれかが見つかりません。HTMLのIDやクラス名を確認してください。");
        // alert("ページ初期化エラー。開発者コンソールを確認してください。"); // 必要であればユーザーに通知
    }

    // --- ヘルパー関数など ---
    function populateFieldDropdown(selectElement, currentSelectedValue) {
        if (!selectElement) return;
        const previouslySelected = currentSelectedValue || (selectElement.options.length > 0 ? selectElement.value : null);
        selectElement.innerHTML = ''; 
        if (availableDataFields.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "データ項目を定義してください";
            option.disabled = true;
            selectElement.appendChild(option);
        } else {
            availableDataFields.forEach(fieldKey => {
                const option = document.createElement('option');
                option.value = fieldKey;
                option.textContent = fieldKey;
                selectElement.appendChild(option);
            });
        }
        if (availableDataFields.includes(previouslySelected)) {
            selectElement.value = previouslySelected;
        } else if (availableDataFields.length > 0) {
            selectElement.value = availableDataFields[0];
        }
    }
    
    function updateAllConditionFieldDropdowns() {
        const allFieldSelects = document.querySelectorAll('.condition-field-select');
        allFieldSelects.forEach(select => {
            populateFieldDropdown(select, select.value);
        });
    }
    
    // --- データ定義関連の関数 ---
    function updateAvailableDataFields() {
        availableDataFields = [];
        if (dataFieldsContainer) {
            const keyInputs = dataFieldsContainer.querySelectorAll('.data-key');
            keyInputs.forEach(input => {
                const key = input.value.trim();
                if (key !== '') {
                    availableDataFields.push(key);
                }
            });
        }
        updateAllConditionFieldDropdowns();
    }

    function createDataFieldRow(initialData) {
        const row = document.createElement('div');
        row.classList.add('data-field-row');
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = '項目名';
        keyInput.classList.add('data-key');
        keyInput.value = initialData && initialData.key !== undefined ? initialData.key : "";
        keyInput.addEventListener('input', updateAvailableDataFields);
        const equalsSign = document.createElement('span');
        equalsSign.classList.add('equals-sign');
        equalsSign.textContent = '=';
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = '値';
        valueInput.classList.add('data-value');
        valueInput.value = initialData && initialData.value !== undefined ? initialData.value : "";
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-button');
        removeButton.textContent = '×';
        removeButton.addEventListener('click', function() {
            row.remove();
            updateAvailableDataFields();
        });
        row.appendChild(keyInput);
        row.appendChild(equalsSign);
        row.appendChild(valueInput);
        row.appendChild(removeButton);
        return row;
    }

    function getCurrentDataDefinitionsFromUi() {
        const definitions = [];
        if (dataFieldsContainer) {
            const rows = dataFieldsContainer.querySelectorAll('.data-field-row');
            rows.forEach(row => {
                const keyInput = row.querySelector('.data-key');
                const valueInput = row.querySelector('.data-value');
                if (keyInput && valueInput) {
                    const key = keyInput.value.trim();
                    if (key) { 
                        definitions.push({ key: key, value: valueInput.value.trim() });
                    }
                }
            });
        }
        return definitions;
    }

    function buildDataDefinitionsUi(definitionsArray) {
        if (!dataFieldsContainer) {
            console.error("buildDataDefinitionsUi: dataFieldsContainer not found.");
            return;
        }
        dataFieldsContainer.innerHTML = ''; 
        if (Array.isArray(definitionsArray)) {
            if (definitionsArray.length === 0) {
                 const sampleRow = createDataFieldRow({ key: "項目名サンプル", value: "値サンプル" });
                 dataFieldsContainer.appendChild(sampleRow);
            } else {
                definitionsArray.forEach(def => {
                    if (typeof def === 'object' && def !== null &&
                        typeof def.key === 'string' && typeof def.value === 'string') {
                        const rowElement = createDataFieldRow({ key: def.key, value: def.value });
                        dataFieldsContainer.appendChild(rowElement);
                    } else {
                        console.warn("buildDataDefinitionsUi: Invalid data definition item (skipped):", def);
                    }
                });
            }
        } else {
            console.warn("buildDataDefinitionsUi: definitionsArray is not an array. Creating sample row.");
            const sampleRow = createDataFieldRow({ key: "項目名サンプル", value: "値サンプル" }); // 修正: ユーザーのコードでは"値"だった
            dataFieldsContainer.appendChild(sampleRow);
        }
        updateAvailableDataFields(); 
    }
    
    if (addDataFieldButton && dataFieldsContainer) {
        addDataFieldButton.addEventListener('click', function() {
            const newRow = createDataFieldRow(); 
            dataFieldsContainer.appendChild(newRow);
            updateAvailableDataFields(); 
        });
    }
    
    // --- データ定義JSONモード切り替え処理 ---
    if (toggleDataJsonModeButton && dataFieldsUiContainer && dataJsonEditorContainer && dataDefinitionJsonTextarea && dataJsonErrorDisplay) {
        toggleDataJsonModeButton.addEventListener('click', function() {
            dataJsonErrorDisplay.textContent = ''; 

            if (!isDataJsonMode) { 
                console.log("Switching to JSON mode for Data Definitions.");
                lastGoodDataDefinitionObject = getCurrentDataDefinitionsFromUi();
                let jsonToShow = lastGoodDataDefinitionObject;
                if (lastGoodDataDefinitionObject.length === 0) { 
                    jsonToShow = [{ key: "項目名サンプル", value: "値サンプル" }]; // 修正: ユーザーのコードでは"Field Name 1"だった
                }
                try {
                    dataDefinitionJsonTextarea.value = JSON.stringify(jsonToShow, null, 2);
                } catch (e) {
                    dataJsonErrorDisplay.textContent = "JSONへの変換中に内部エラー: " + e.message;
                    return; 
                }
                dataFieldsUiContainer.style.display = 'none';
                dataJsonEditorContainer.style.display = 'block';
                toggleDataJsonModeButton.textContent = 'UIに適用して戻る';
                isDataJsonMode = true;

            } else { 
                const currentButtonText = toggleDataJsonModeButton.textContent;
                console.log("Currently in JSON mode (Data Def). Button text:", currentButtonText);

                if (currentButtonText === 'UIに適用して戻る') {
                    console.log("Attempting to apply JSON (Data Def) and switch to UI mode.");
                    const jsonString = dataDefinitionJsonTextarea.value;
                    try {
                        const parsedData = JSON.parse(jsonString);
                        if (!Array.isArray(parsedData)) {
                            throw new Error("JSONデータは配列であるべきです (例: [{\"key\":\"k1\", \"value\":\"v1\"}, ...])");
                        }
                        for (let i = 0; i < parsedData.length; i++) {
                            const item = parsedData[i];
                            if (typeof item !== 'object' || item === null || 
                                typeof item.key !== 'string' || typeof item.value !== 'string') {
                                throw new Error(`配列の ${i+1} 番目の要素の形式が正しくありません。各要素は {"key": "文字列", "value": "文字列"} であるべきです。`);
                            }
                        }
                        buildDataDefinitionsUi(parsedData);
                        lastGoodDataDefinitionObject = parsedData; 
                        dataFieldsUiContainer.style.display = 'block';
                        dataJsonEditorContainer.style.display = 'none';
                        toggleDataJsonModeButton.textContent = 'JSONで編集';
                        isDataJsonMode = false;
                        console.log("JSON (Data Def) applied. Switched to UI mode.");
                    } catch (e) {
                        let errorMessage = "JSONエラー: " + e.message;
                        const matchPos = e.message.match(/position\s+(\d+)/);
                        const matchLine = e.message.match(/line\s+(\d+)/);
                        if (matchLine) { errorMessage += ` (${matchLine[0]} 付近)`;
                        } else if (matchPos) { errorMessage += ` (${parseInt(matchPos[1])+1}文字目 付近)`; }
                        dataJsonErrorDisplay.textContent = errorMessage;
                        toggleDataJsonModeButton.textContent = 'UIに戻る (JSON破棄)'; 
                        console.log("JSON (Data Def) apply failed. Button text changed to discard option.");
                    }
                } else if (currentButtonText === 'UIに戻る (JSON破棄)') {
                    console.log("Discarding JSON (Data Def) edits and switching to UI mode.");
                    buildDataDefinitionsUi(lastGoodDataDefinitionObject); 
                    dataFieldsUiContainer.style.display = 'block';
                    dataJsonEditorContainer.style.display = 'none';
                    toggleDataJsonModeButton.textContent = 'JSONで編集';
                    isDataJsonMode = false;
                }
            }
        });
    } else {
        console.error("Data Definition JSON toggle button or related containers not found.");
    }
    
    // --- 条件設定関連の関数 ---
    function createConditionRowElement(initialData) {
        const conditionRow = document.createElement('div'); conditionRow.classList.add('condition-row');
        const initialField = initialData ? initialData.field : null; const initialOperator = initialData ? initialData.operator : '=='; const initialValue = initialData ? initialData.value : '';
        const fieldSelect = document.createElement('select'); fieldSelect.classList.add('condition-field-select'); populateFieldDropdown(fieldSelect, initialField);
        const operatorSelect = document.createElement('select'); operatorSelect.classList.add('condition-operator-select');
        const operators = [ ['次と等しい (文字)', '=='], ['次と等しくない (文字)', '!='], ['次を含む', 'contains'], ['次を含まない', 'not_contains'], ['次で始まる', 'startsWith'], ['次で終わる', 'endsWith'], ['正規表現に一致', 'regex'], ['より大きい (数値)', '>'], ['より小さい (数値)', '<'], ['以上 (数値)', '>='], ['以下 (数値)', '<='], ['空である', 'isEmpty'], ['空でない', 'isNotEmpty'] ];
        operators.forEach(([text, value]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; operatorSelect.appendChild(option); }); operatorSelect.value = initialOperator;
        const valueInput = document.createElement('input'); valueInput.type = 'text'; valueInput.placeholder = '比較する値'; valueInput.classList.add('condition-value-input'); valueInput.value = initialValue;
        const duplicateBtn = document.createElement('button'); duplicateBtn.classList.add('duplicate-button', 'action-button'); duplicateBtn.textContent = '複製'; duplicateBtn.title = 'この条件を複製';
        duplicateBtn.addEventListener('click', function() { const currentRowData = { field: fieldSelect.value, operator: operatorSelect.value, value: valueInput.value }; const newRow = createConditionRowElement(currentRowData); conditionRow.insertAdjacentElement('afterend', newRow); });
        const removeBtn = document.createElement('button'); removeBtn.classList.add('remove-button'); removeBtn.textContent = '×'; removeBtn.title = 'この条件を削除'; removeBtn.addEventListener('click', function() { conditionRow.remove(); });
        conditionRow.appendChild(fieldSelect); conditionRow.appendChild(operatorSelect); conditionRow.appendChild(valueInput); conditionRow.appendChild(duplicateBtn); conditionRow.appendChild(removeBtn); return conditionRow;
    }
    function createConditionGroupElement() {
        const groupDiv = document.createElement('div'); groupDiv.classList.add('condition-group'); const groupControls = document.createElement('div'); groupControls.classList.add('group-controls'); const groupTypeSelect = document.createElement('select'); groupTypeSelect.classList.add('group-type-select'); ['AND', 'OR'].forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type === 'AND' ? 'すべての条件に一致 (AND)' : 'いずれかの条件に一致 (OR)'; groupTypeSelect.appendChild(option); }); groupControls.appendChild(groupTypeSelect); const conditionsList = document.createElement('div'); conditionsList.classList.add('conditions-list'); const groupActions = document.createElement('div'); groupActions.classList.add('group-actions'); const addConditionBtnInGroup = document.createElement('button'); addConditionBtnInGroup.classList.add('add-condition-button'); addConditionBtnInGroup.textContent = '条件を追加'; addConditionBtnInGroup.addEventListener('click', function() { conditionsList.appendChild(createConditionRowElement()); }); const addGroupBtnInGroup = document.createElement('button'); addGroupBtnInGroup.classList.add('add-group-button'); addGroupBtnInGroup.textContent = '条件グループを追加'; addGroupBtnInGroup.addEventListener('click', function() { conditionsList.appendChild(createConditionGroupElement()); }); const removeGroupBtn = document.createElement('button'); removeGroupBtn.classList.add('remove-button'); removeGroupBtn.textContent = 'グループ削除'; removeGroupBtn.style.backgroundColor = '#ffdddd'; removeGroupBtn.addEventListener('click', function() { groupDiv.remove(); }); groupActions.appendChild(addConditionBtnInGroup); groupActions.appendChild(addGroupBtnInGroup); groupActions.appendChild(removeGroupBtn); groupDiv.appendChild(groupControls); groupDiv.appendChild(conditionsList); groupDiv.appendChild(groupActions); return groupDiv;
    }
    if(rootAddConditionButton && rootConditionsList) rootAddConditionButton.addEventListener('click', function() { rootConditionsList.appendChild(createConditionRowElement()); });
    if(rootAddGroupButton && rootConditionsList) rootAddGroupButton.addEventListener('click', function() { rootConditionsList.appendChild(createConditionGroupElement()); });
    
    function collectConditions(groupElement) {
        if (!groupElement) { console.error("collectConditions: groupElement is null or undefined. Defaulting to empty AND group."); return { type: 'group', groupType: 'AND', items: [] }; } 
        const groupTypeElement = groupElement.querySelector('.group-type-select'); 
        const groupType = groupTypeElement ? groupTypeElement.value : 'AND'; 
        const items = []; 
        const listElement = groupElement.querySelector('.conditions-list'); 
        if (listElement) { 
            listElement.childNodes.forEach(child => { 
                if (child.nodeType === Node.ELEMENT_NODE) { 
                    if (child.classList.contains('condition-row')) { 
                        const fieldEl = child.querySelector('.condition-field-select'); 
                        const operatorEl = child.querySelector('.condition-operator-select'); 
                        const valueEl = child.querySelector('.condition-value-input'); 
                        if (fieldEl && operatorEl && valueEl) { 
                            items.push({ type: 'condition', field: fieldEl.value, operator: operatorEl.value, value: valueEl.value }); 
                        } 
                    } else if (child.classList.contains('condition-group')) { 
                        items.push(collectConditions(child)); 
                    } 
                } 
            }); 
        } 
        return { type: 'group', groupType, items }; 
    }

    // --- ★★★ 条件設定JSONモード向け: UI再構築関数 (新規追加) ★★★ ---
    function buildUiFromConditionObject(node, parentListElementOrGroup) {
        if (!node || !parentListElementOrGroup) {
            console.error("buildUiFromConditionObject: Invalid node or parent element.", node, parentListElementOrGroup);
            return;
        }

        // Determine if the parent is the root group itself or a conditions-list within a group
        let targetListElement;
        if (parentListElementOrGroup.classList.contains('condition-group')) {
            // If parent is a group div, get its .conditions-list
            targetListElement = parentListElementOrGroup.querySelector('.conditions-list');
            // Also set the groupType for this parent group
            const groupTypeSelect = parentListElementOrGroup.querySelector('.group-type-select');
            if (groupTypeSelect && node.type === 'group' && node.groupType) { // Ensure node is a group before accessing groupType
                groupTypeSelect.value = node.groupType;
            }
        } else if (parentListElementOrGroup.classList.contains('conditions-list')) {
            // If parent is already a conditions-list div
            targetListElement = parentListElementOrGroup;
        } else {
            console.error("buildUiFromConditionObject: parentListElementOrGroup is neither a .condition-group nor a .conditions-list.");
            return;
        }

        if (!targetListElement) {
             console.error("buildUiFromConditionObject: Could not find target .conditions-list.");
            return;
        }
        
        // If the node itself is a group, its items go into its own list.
        // If this function is called with the root condition object, node.items will be processed.
        const itemsToProcess = node.type === 'group' ? node.items : [node]; // Handle single condition node passed directly for non-recursive cases (though not used like that here)

        if (Array.isArray(itemsToProcess)) {
            itemsToProcess.forEach(itemNode => {
                if (itemNode.type === 'condition') {
                    const conditionRowEl = createConditionRowElement(itemNode); 
                    targetListElement.appendChild(conditionRowEl);
                } else if (itemNode.type === 'group') {
                    const newGroupEl = createConditionGroupElement(); 
                    const newGroupTypeSelect = newGroupEl.querySelector('.group-type-select');
                    if (newGroupTypeSelect && itemNode.groupType) {
                        newGroupTypeSelect.value = itemNode.groupType;
                    }
                    // Recursively build children into the new group's list
                    // The 'parent' for the children is the new group element itself.
                    buildUiFromConditionObject(itemNode, newGroupEl); 
                    targetListElement.appendChild(newGroupEl);
                } else {
                    console.warn("buildUiFromConditionObject: Unknown item node type", itemNode);
                }
            });
        }
    }

    // --- ★★★ 条件設定JSONモード関連イベントリスナー (新規追加) ★★★ ---
    if (toggleConditionsJsonModeButton && conditionBuilderUiContainer && conditionsJsonEditorContainer && conditionSettingsJsonTextarea && conditionsJsonErrorDisplay && conditionRoot) {
        toggleConditionsJsonModeButton.addEventListener('click', function() {
            conditionsJsonErrorDisplay.textContent = ''; 

            if (!isConditionsJsonMode) {
                console.log("Switching to JSON mode for Condition Settings.");
                lastGoodConditionsObject = collectConditions(conditionRoot);
                let jsonToShow = lastGoodConditionsObject;
                if (!lastGoodConditionsObject || !lastGoodConditionsObject.items || lastGoodConditionsObject.items.length === 0) {
                    jsonToShow = { type: "group", groupType: "AND", items: [] }; 
                }
                try {
                    conditionSettingsJsonTextarea.value = JSON.stringify(jsonToShow, null, 2);
                } catch (e) {
                    conditionsJsonErrorDisplay.textContent = "JSONへの変換中に内部エラー: " + e.message;
                    return;
                }
                conditionBuilderUiContainer.style.display = 'none';
                conditionsJsonEditorContainer.style.display = 'block';
                toggleConditionsJsonModeButton.textContent = 'UIに適用して戻る';
                isConditionsJsonMode = true;

            } else {
                const currentButtonText = toggleConditionsJsonModeButton.textContent;
                console.log("Currently in JSON mode (Conditions). Button text:", currentButtonText);

                if (currentButtonText === 'UIに適用して戻る') {
                    console.log("Attempting to apply JSON (Conditions) and switch to UI mode.");
                    const jsonString = conditionSettingsJsonTextarea.value;
                    try {
                        const parsedConditions = JSON.parse(jsonString);
                        
                        // Basic structural validation for conditions JSON
                        if (typeof parsedConditions !== 'object' || parsedConditions === null || 
                            parsedConditions.type !== 'group' || !Array.isArray(parsedConditions.items) ||
                            (parsedConditions.groupType !== 'AND' && parsedConditions.groupType !== 'OR') ) {
                            throw new Error("JSONのルート構造が不正です。{type:'group', groupType:'AND'|'OR', items:[]} の形式であるべきです。");
                        }
                        // TODO: Add recursive validation for all nested items if needed.

                        // Clear existing UI in #condition-root's list
                        const rootList = conditionRoot.querySelector('.conditions-list');
                        if (rootList) rootList.innerHTML = '';
                        else { throw new Error("ルートの .conditions-list が見つかりません。"); }
                        
                        // Rebuild UI from parsed JSON, starting with the root group itself.
                        buildUiFromConditionObject(parsedConditions, conditionRoot);
                        
                        lastGoodConditionsObject = parsedConditions; 
                        
                        conditionBuilderUiContainer.style.display = 'block';
                        conditionsJsonEditorContainer.style.display = 'none';
                        toggleConditionsJsonModeButton.textContent = 'JSONで編集';
                        isConditionsJsonMode = false;
                        console.log("JSON (Conditions) applied. Switched to UI mode.");

                    } catch (e) { 
                        let errorMessage = "JSONエラー: " + e.message;
                        const matchPos = e.message.match(/position\s+(\d+)/);
                        const matchLine = e.message.match(/line\s+(\d+)/);
                        if (matchLine) { errorMessage += ` (${matchLine[0]} 付近)`; } 
                        else if (matchPos) { errorMessage += ` (${parseInt(matchPos[1])+1}文字目 付近)`;}
                        conditionsJsonErrorDisplay.textContent = errorMessage;
                        toggleConditionsJsonModeButton.textContent = 'UIに戻る (JSON破棄)';
                        console.log("JSON (Conditions) apply failed. Button text changed to discard option.");
                    }
                } else if (currentButtonText === 'UIに戻る (JSON破棄)') {
                    console.log("Discarding JSON (Conditions) edits and switching to UI mode.");
                    const rootList = conditionRoot.querySelector('.conditions-list');
                    if (rootList && lastGoodConditionsObject) { 
                        rootList.innerHTML = '';
                        buildUiFromConditionObject(lastGoodConditionsObject, conditionRoot);
                    }
                    
                    conditionBuilderUiContainer.style.display = 'block';
                    conditionsJsonEditorContainer.style.display = 'none';
                    toggleConditionsJsonModeButton.textContent = 'JSONで編集';
                    isConditionsJsonMode = false;
                }
            }
        });
    } else {
        console.error("Condition Settings JSON toggle button or related containers not found.");
    }
    
    // --- 評価ロジック関連関数 (変更なし) ---
    function evaluateSingleRule(actualValue, operator, expectedValue, fieldName) {
        const valExists = actualValue !== undefined && actualValue !== null; const valStr = valExists ? String(actualValue) : ""; let result = false; let evalDetails = { operator, expected: expectedValue, actual: valStr, field: fieldName };
        try { if (operator === 'isEmpty') { result = !valExists || valStr === ""; } else if (operator === 'isNotEmpty') { result = valExists && valStr !== ""; } else if (operator === '>' || operator === '<' || operator === '>=' || operator === '<=') { if (!valExists || String(expectedValue).trim() === '') { result = false; } else { const numActual = parseFloat(valStr); const numExpected = parseFloat(expectedValue); if (isNaN(numActual) || isNaN(numExpected)) { result = false; evalDetails.message = "数値変換不可"; } else { if (operator === '>') result = numActual > numExpected; else if (operator === '<') result = numActual < numExpected; else if (operator === '>=') result = numActual >= numExpected; else if (operator === '<=') result = numActual <= numExpected; } } } else { const expectStr = expectedValue === undefined || expectedValue === null ? "" : String(expectedValue); evalDetails.expected = expectStr; switch (operator) { case '==': result = valStr == expectStr; break; case '!=': result = valStr != expectStr; break; case 'contains': result = valStr.includes(expectStr); break; case 'not_contains': result = !valStr.includes(expectStr); break; case 'startsWith': result = valStr.startsWith(expectStr); break; case 'endsWith': result = valStr.endsWith(expectStr); break; case 'regex': if (expectStr === '') { result = false; } else { const regex = new RegExp(expectStr); result = regex.test(valStr); } break; default: console.warn("evaluateSingleRule: Unknown operator - " + operator); result = false; } } } catch (e) { console.error("evaluateSingleRule Error:", e.message, evalDetails); result = false; evalDetails.message = e.message; } return { result, details: evalDetails };
    }
    function evaluateConditionTree(conditionNode, testData) {
        if (!conditionNode) return { type: 'error', message: "conditionNode is null", result: false }; if (conditionNode.type === 'condition') { const evaluation = evaluateSingleRule(testData[conditionNode.field], conditionNode.operator, conditionNode.value, conditionNode.field); return { ...conditionNode, evaluation }; } else if (conditionNode.type === 'group') { const evaluatedItems = []; let groupResult; if (!conditionNode.items || conditionNode.items.length === 0) { groupResult = conditionNode.groupType === 'AND'; } else { if (conditionNode.groupType === 'AND') { groupResult = true; for (const item of conditionNode.items) { const evaluatedItem = evaluateConditionTree(item, testData); evaluatedItems.push(evaluatedItem); } groupResult = evaluatedItems.every(item => item.type === 'condition' ? item.evaluation.result : item.result); } else if (conditionNode.groupType === 'OR') { groupResult = false; for (const item of conditionNode.items) { const evaluatedItem = evaluateConditionTree(item, testData); evaluatedItems.push(evaluatedItem); } groupResult = evaluatedItems.some(item => item.type === 'condition' ? item.evaluation.result : item.result); } } return { type: 'group', groupType: conditionNode.groupType, items: evaluatedItems, result: groupResult }; } return { type: 'error', message: `Unknown node type: ${conditionNode.type}`, result: false };
    }
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return ""; return String(unsafe) .replace(/&/g, "&amp;") .replace(/</g, "&lt;") .replace(/>/g, "&gt;") .replace(/"/g, "&quot;") .replace(/'/g, "&#039;");
    }
    function renderEvaluatedTreeToHtml(evaluatedNode, indentLevel = 0) {
        const indent = '  '.repeat(indentLevel); const nextIndent = '  '.repeat(indentLevel + 1); let html = ''; if (evaluatedNode.type === 'condition') { const evalResult = evaluatedNode.evaluation.result; const className = evalResult ? 'highlight-true' : 'highlight-false'; html += `${indent}<span class="${className}">{<br>`; html += `${nextIndent}"type": "condition",<br>`; html += `${nextIndent}"field": "${escapeHtml(evaluatedNode.field)}",<br>`; html += `${nextIndent}"operator": "${escapeHtml(evaluatedNode.operator)}",<br>`; html += `${nextIndent}"value": "${escapeHtml(evaluatedNode.value)}",<br>`; html += `${nextIndent}"_evaluation_result": ${evalResult}<br>`; html += `${indent}}</span>`; } else if (evaluatedNode.type === 'group') { const groupResult = evaluatedNode.result; const className = groupResult ? 'highlight-true' : 'highlight-false'; html += `${indent}<span class="${className}">{</span><br>`; html += `${nextIndent}"type": "group",<br>`; html += `${nextIndent}"groupType": "<span class="${className}">${evaluatedNode.groupType}</span>",<br>`; html += `${nextIndent}"_group_result": ${groupResult},<br>`; html += `${nextIndent}"items": [`; if (evaluatedNode.items.length > 0) { html += `<br>`; evaluatedNode.items.forEach((item, index) => { html += renderEvaluatedTreeToHtml(item, indentLevel + 2); if (index < evaluatedNode.items.length - 1) { html += `,`; } html += `<br>`; }); html += `${nextIndent}]<br>`; } else { html += `]<br>`; } html += `${indent}<span class="${className}">}</span>`; } else if (evaluatedNode.type === 'error') { html += `${indent}<span class="highlight-false">{<br>`; html += `${nextIndent}"type": "error",<br>`; html += `${nextIndent}"message": "${escapeHtml(evaluatedNode.message)}"<br>`; html += `${indent}}</span>`; } return html;
    }

    if(evaluateFilterButton) {
        evaluateFilterButton.addEventListener('click', function() {
            console.log("「フィルター実行」ボタンがクリックされました。"); 
            
            // 1. テストデータをUIから収集 (これはオブジェクトの配列を返す)
            const definedDataArray = getCurrentDataDefinitionsFromUi(); 
            console.log("収集されたテストデータ (配列形式):", definedDataArray);

            // ★★★ ここから修正 ★★★
            // 評価関数用に、配列をオブジェクトマップ形式に変換する
            const testDataForEvaluation = {};
            definedDataArray.forEach(item => {
                if (item && typeof item.key === 'string') { // item.keyが存在し、文字列であることを確認
                    testDataForEvaluation[item.key] = item.value;
                }
            });
            console.log("評価用に変換されたテストデータ (オブジェクト形式):", testDataForEvaluation);
            // ★★★ ここまで修正 ★★★

            let collectedConditionStructure = null; 
            if (conditionRoot) { 
                collectedConditionStructure = collectConditions(conditionRoot); 
            } else { 
                console.error("ルート条件要素(#condition-root)が見つかりません。"); 
                const fd = document.getElementById('finalBooleanResultDisplay'); 
                if(fd){fd.textContent='エラー:条件設定構造読取失敗'; fd.className='boolean-result-prominent false';} 
                return; 
            }
            console.log("収集された条件構造:", collectedConditionStructure);
            
            // ★変更: 評価関数には変換後のオブジェクトを渡す
            const evaluatedTree = evaluateConditionTree(collectedConditionStructure, testDataForEvaluation); 
            const overallResult = evaluatedTree.type === 'group' ? evaluatedTree.result : 
                                  (evaluatedTree.type === 'condition' ? evaluatedTree.evaluation.result : false);
            console.log("評価済み条件ツリー:", evaluatedTree);
            
            const finalBooleanResultDiv = document.getElementById('finalBooleanResultDisplay'); 
            const testDataJsonPre = document.getElementById('testDataJsonOutput'); 
            const conditionStructureJsonPre = document.getElementById('conditionStructureJsonOutput');
            
            if (finalBooleanResultDiv && testDataJsonPre && conditionStructureJsonPre) {
                finalBooleanResultDiv.textContent = overallResult ? 'True (条件に一致しました)' : 'False (条件に一致しませんでした)'; 
                finalBooleanResultDiv.className = 'boolean-result-prominent'; 
                finalBooleanResultDiv.classList.add(overallResult ? 'true' : 'false');
                try { 
                    // 表示するテストデータJSONは元の配列形式のままでOK (ユーザーがJSON編集で使う形式と合わせる)
                    testDataJsonPre.textContent = JSON.stringify(definedDataArray, null, 2); 
                } catch (e) { 
                    testDataJsonPre.textContent = "テストデータのJSON変換エラー: " + e.message; 
                }
                try { 
                    conditionStructureJsonPre.innerHTML = renderEvaluatedTreeToHtml(evaluatedTree); 
                } catch (e) { 
                    conditionStructureJsonPre.textContent = "条件構造のHTML表示エラー: " + e.message; 
                    console.error("条件構造のHTML表示エラー:", e); 
                }
            } else { 
                console.error("結果表示用のHTML要素のいずれかが見つかりません。"); 
            }
        });
    } else {
        console.error("「フィルター実行」ボタン(ID: evaluateButton)がHTMLに見つかりませんでした。");
    }

    // --- 初期化処理 ---
    buildDataDefinitionsUi([{ key: "項目名サンプル", value: "値サンプル" }]); // 修正: ユーザーのコードに合わせたサンプル
    lastGoodDataDefinitionObject = getCurrentDataDefinitionsFromUi(); 
    
    // 条件設定の初期状態 (空のANDグループ) を lastGoodConditionsObject にも設定
    if (conditionRoot) {
        lastGoodConditionsObject = collectConditions(conditionRoot); // 初期は {type:'group', groupType:'AND', items:[]} になるはず
    } else {
        lastGoodConditionsObject = { type: 'group', groupType: 'AND', items: [] }; // フォールバック
    }
    
    console.log("スクリプトの初期化が完了しました。");
});