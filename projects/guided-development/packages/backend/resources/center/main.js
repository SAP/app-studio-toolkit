//@ts-check

(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { tutorials: [] };

    /** @type {Array<{ extensionId: string, id: string, title: string, description: string, disabled?: boolean }>} */
    let tutorials = oldState.tutorials;
    updateGuideList(tutorials);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'refreshData':
                {
                    tutorials = message.data.items;
                    updateGuideList(tutorials);
                    break;
                }
        }
    });

    /**
     * @param {Array<{ id: string, name: string, link: string, linktext: string, description: string, collectionIds: Array<string>, icon: string, collections: Array<any> }>} tutorials
     */
    function updateGuideList(tutorials) {
        const tul = document.querySelector('.guide-list');
        if (!tutorials || !tul) return;
        const oParent = tul.parentElement;
        tul.textContent = '';
        for (const tutorial of tutorials) {
            const tli = document.createElement('li');
            tli.className = 'tutorial-item';

            const oTIcon = document.createElement('div');
            oTIcon.className = 'tutorial-icon codicon codicon-view-pane-container-collapsed';
            tli.appendChild(oTIcon);

            //tutorial header
            const oTHeader = document.createElement('div');
            oTHeader.className = 'tutorial-header';
            const oTLabel = document.createElement('label');
            oTLabel.className = 'tutorial-title';
            oTLabel.title = tutorial.description;
            oTLabel.textContent = tutorial.name;
            oTHeader.appendChild(oTLabel);
            if (tutorial.linktext) {
                const oTLink = document.createElement('a');
                oTLink.className = 'tutorial-link';
                oTLink.title = tutorial.linktext;
                oTLink.textContent = tutorial.linktext;
                oTLink.href = tutorial.link;
                oTHeader.appendChild(oTLink);
            }
            tli.appendChild(oTHeader);

            //tutorial collections
            const ul = document.createElement('ul');
            ul.className = 'tutorial-content hide';
            let index = 0;
            for (const guide of tutorial.collections) {
                const li = document.createElement('li');
                li.className = 'guide-item';
                if (guide.disabled === true) {
                    li.ariaDisabled = "true";
                    li.classList.add("disabled");
                }
                const oHeader = document.createElement('div');
                oHeader.className = 'guide-header';
                const label = document.createElement('label');
                label.className = 'guide-title';
                const title = tutorial.id === '_standalone'? guide.title : ++index + '. ' + guide.title;
                label.title = title;
                label.textContent = title;
                oHeader.appendChild(label);

                const oSubHeader = document.createElement('div');
                oHeader.className = 'guide-subheader';
                const sublabel = document.createElement('label');
                sublabel.className = 'guide-subtitle';
                sublabel.title = guide.additionalInfo?.tool + ' | ';
                sublabel.textContent = guide.additionalInfo?.tool + ' | ';
                const oIcon1 = document.createElement("img");
                oIcon1.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjMiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAyMyAxOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNTIgMS43Nkw3LjI0IDAuOTZIMTAuMjhMMTEgMS43NlYxOC4yNEwxMC4yOCAxOC45Nkg3LjI0TDYuNTIgMTguMjRWMS43NlpNOC4wNCAyLjQ4VjE3LjUySDkuNDhWMi40OEg4LjA0Wk0xMi43NiAzLjA0TDEzLjI0IDIuMDhMMTYuMDQgMS4wNEwxNyAxLjQ0TDIyLjYgMTYuOTZMMjIuMiAxNy45MkwxOS40IDE4Ljk2TDE4LjQ0IDE4LjU2TDEyLjc2IDMuMDRaTTE0LjQ0IDMuMkwxOS41NiAxNy4yOEwyMSAxNi44TDE1LjggMi43MkwxNC40NCAzLjJaTTAuNTIgMS43NkwxLjI0IDAuOTZINC4yOEw1IDEuNzZWMTguMjRMNC4yOCAxOC45NkgxLjI0TDAuNTIgMTguMjRWMS43NlpNMi4wNCAyLjQ4VjE3LjUySDMuNDhWMi40OEgyLjA0WiIgZmlsbD0idmFyKC0tdnNjb2RlLWlucHV0LWJhY2tncm91bmQpIi8+Cjwvc3ZnPg==";
                oIcon1.className = 'guide-time';
                const sublabel2 = document.createElement('label');
                sublabel2.className = 'guide-subtitle';
                sublabel2.title = guide.additionalInfo?.estimatedTime;
                sublabel2.textContent = guide.additionalInfo?.estimatedTime;
                oSubHeader.appendChild(sublabel);
                oSubHeader.appendChild(oIcon1);
                oSubHeader.appendChild(sublabel2);

                const oDetail = document.createElement('div');
                oDetail.className = 'guide-detail';
                const textNode=document.createTextNode(guide.description);
                oDetail.appendChild(textNode);

                //collection icon
                if (guide.additionalInfo?.iconName) {
                    const oPrefixIconContainer = document.createElement('div');
                    oPrefixIconContainer.className = 'prefix-icon-container';
                    const oPrefixIcon = document.createElement('div');
                    oPrefixIcon.className = 'prefix-icon';
                    const oCIcon = document.createElement('div');
                    oCIcon.className = 'prefix-collection-icon';
                    const oSpan = document.createElement('span');
                    oSpan.className = 'prefix-icon-span codicon codicon-' + guide.additionalInfo?.iconName;
                    oCIcon.appendChild(oSpan);
                    oPrefixIcon.appendChild(oCIcon);
                    oPrefixIconContainer.appendChild(oPrefixIcon);
                    li.appendChild(oPrefixIconContainer);
                }

                const oWrapper = document.createElement('div');
                oWrapper.className = 'guide-wrapper';
                oWrapper.appendChild(oHeader);
                if(guide.additionalInfo) oWrapper.appendChild(oSubHeader);
                oWrapper.appendChild(oDetail);
                li.appendChild(oWrapper);

                li.addEventListener('click', () => {
                    if(li.classList.contains("selected")) {
                        li.classList.add("focused");
                    } else {
                        for (const item of ul.children) {
                            item.classList.remove("selected", "focused");
                        }
                        li.classList.add("selected", "focused");
                    }
                    onGuideClicked(guide);
                });
                oParent?.addEventListener("focusout", () => {
                    for (const item of ul.children) {
                        item.classList.remove("focused");
                    }
                });

                ul.appendChild(li);
            }
            tli.addEventListener("click", (event) => {
                // @ts-ignore
                if (event.target === tli || event.target === oTLabel) {
                    if(oTIcon.classList.contains("codicon-view-pane-container-collapsed")) {
                        oTIcon.classList.remove("codicon-view-pane-container-collapsed");
                        oTIcon.classList.add("codicon-view-pane-container-expanded");
                        ul.classList.remove("hide")
                    } else {
                        oTIcon.classList.remove("codicon-view-pane-container-expanded");
                        oTIcon.classList.add("codicon-view-pane-container-collapsed");
                        ul.classList.add("hide");
                    }
                }
            });    
            tli.appendChild(ul);
            tul.appendChild(tli);
        }

        // Update the saved state
        vscode.setState({ tutorials: tutorials });
    }

    /** 
     * @param {any} guide 
     */
    function onGuideClicked(guide) {
        vscode.postMessage({ type: 'guideSelected', value: {renderType: guide.type?guide.type:"collection", extensionId: guide.extensionId, id: guide.id, title: guide.title, description: guide.description, additionalInfo: guide.additionalInfo} });
    }

    vscode.postMessage({ type: 'onInitialized', value: {tutorials: tutorials} });
}());
