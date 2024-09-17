document.addEventListener("DOMContentLoaded", async (event) => {

    let teams, matches;
    [teams, matches] = await Promise.all([fetchTeams(), fetchMatches()]);

    console.log(teams);
    console.log(matches);

    let bracket = new Bracket(document.querySelector("#bracket-container"), teams);

    bracket.renderBracket();
    bracket.setMatchTeams(1, 1, 2);
    bracket.setMatchTeams(2, 3, 4);
    bracket.setMatchTeams(3, 5, 6);
    bracket.setMatchTeams(4, 7, 8);
    bracket.setMatchTeams(5, 9, 10);
    bracket.setMatchTeams(6, 11, 12);
    bracket.setMatchTeams(7, 13, 14);
    bracket.setMatchTeams(8, 15, 16);

    document.getElementById("test").addEventListener("click", event => {
        bracket.setWinner(1, 1, 1);
        // bracket.setWinner(1, 3, 6);
        // bracket.setWinner(1, 4, 8);
        // bracket.setWinner(1, 5, 9);
        // bracket.setWinner(1, 6, 12);
        // bracket.setWinner(1, 7, 14);
        // bracket.setWinner(1, 8, 16);
        // bracket.setWinner(2, 1, 3);
        // bracket.setWinner(2, 2, 6);
        // bracket.setWinner(2, 3, 9);
        // bracket.setWinner(2, 4, 14);
        // bracket.setWinner(3, 1, 6);
        // bracket.setWinner(3, 2, 9);
    });

    enableScroll();
    handelResize();
});

function handelResize() {
    let resizeBtn = document.getElementById("resize-btn");
    adjustZoom();
    resizeBtn.addEventListener("click", (event) => {
        let isFull = resizeBtn.getAttribute("is-full");
        if (isFull == 'false') {
            adjustZoom();
            resizeBtn.querySelector("i").classList.remove("fa-down-left-and-up-right-to-center");
            resizeBtn.querySelector("i").classList.add("fa-up-right-and-down-left-from-center");
        }
        else {
            adjustZoom(0);
            resizeBtn.querySelector("i").classList.add("fa-down-left-and-up-right-to-center");
            resizeBtn.querySelector("i").classList.remove("fa-up-right-and-down-left-from-center");
        }

        resizeBtn.setAttribute("is-full", (isFull === "false") ? "true" : "false");
    });
}

function enableScroll() {
    const container = document.querySelector('#bracket-container');

    let isDragging = false;
    let startX;
    let scrollLeft;
    let scrollSpeed = 1.5;

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - container.offsetLeft;//mouse poistion relative to container
        scrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
    });

    container.addEventListener('mouseleave', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
        e.preventDefault();
        if (!isDragging) return;
        console.log("hi");
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * scrollSpeed;
        container.scrollLeft = scrollLeft - walk;
    });
}

/**
 * 
 * @param {number} desiredZoom  Zoom level at the reference width
 */
function adjustZoom(desiredZoom = 0.54) {
    const referenceWidth = 1400; // The width where zoom: 0.42 works perfectly
    const container = document.querySelector("#bracket-container");

    if (container) {
        const viewportWidth = container.offsetWidth;

        // Calculate the new zoom factor
        const newZoom = (viewportWidth / referenceWidth) * desiredZoom;

        // Apply the new zoom to the container's child elements
        const children = container.children;
        for (let i = 0; i < children.length; i++) {
            children[i].style.zoom = `${newZoom}`;
        }
    }
}

async function fetchTeams() {
    let response = await fetch("./teams.json");

    return await response.json();
}

async function fetchMatches() {
    let response = await fetch("./matches.json");

    return await response.json();
}


class Bracket {
    /**
     * @typedef {object[]} teams
     * @property {number} id
     * @property {string} name
     * @property {string} image url of the image
     * @property {string} theme hexa color start with #
     */
    #teams;

    /**
    * @typedef {object[]} matches
    * @property {number} round as ex if we have 4 teams we will have 2 round
    * @property {number} match match number in the round 
    * @property {number|null} team1_id 
    * @property {number|null} team2_id 
    * @property {number|null} winner_id
    */
    #matches;

    /**
     * @typedef {object} layoutContainer
     * @property {HTMLElement} mainContainer
     * @property {HTMLElement} leftSideBracketContainer
     * @property {HTMLElement} rightSideBracketContainer
     */
    #layoutContainer;

    /**
     * @param {HTMLElement} container  where bracket should append
     * @param {object[]} teams
     * @param {number} teams.id
     * @param {string} teams.name
     * @param {string} teams.image url of the image
     * @param {string} teams.theme hexa color start with #
     * @returns {void}
     */
    constructor(container, teams, matches = []) {
        this.#layoutContainer = {};
        this.#layoutContainer.mainContainer = container;
        this.#teams = teams;
        this.#matches = matches;
    }

    renderBracket() {
        this.#layoutContainer.mainContainer.innerHTML = '';

        this.#layoutContainer.leftSideBracketContainer = this.#getBracketSideAsHTMLElement("bracket-left");
        this.#layoutContainer.rightSideBracketContainer = this.#getBracketSideAsHTMLElement("bracket-right");

        this.#layoutContainer.mainContainer.append(this.#layoutContainer.leftSideBracketContainer);
        this.#layoutContainer.mainContainer.append(this.#getCupImageAsHTMLElement());
        this.#layoutContainer.mainContainer.append(this.#layoutContainer.rightSideBracketContainer);

        // //values just for one side
        // let noOfMatches = this.#teams.length - 1;

        if (!this.#matches.length)
            this.#fillMatchesWithDefaultValue();

        let noOfRounds = Math.log2(this.#teams.length);

        //append round
        let i, matchesAtRoundI;
        for (i = 1; i < noOfRounds; ++i) {
            matchesAtRoundI = this.#matches.filter(match => match.round === i);

            //matchesAtRoundI will contain all matches in both side so we need to divid them
            this.#layoutContainer.leftSideBracketContainer.append(this.#getRoundAsHTMLElement(matchesAtRoundI.slice(0, matchesAtRoundI.length / 2)));
            this.#layoutContainer.rightSideBracketContainer.append(this.#getRoundAsHTMLElement(matchesAtRoundI.slice(matchesAtRoundI.length / 2)));
        }

        //add final match
        matchesAtRoundI = this.#matches.filter(match => match.round === i);

        let team1Data = this.#teams.find(team => team.id === matchesAtRoundI[0].team1_id);
        let team2Data = this.#teams.find(team => team.id === matchesAtRoundI[0].team2_id);

        let leftFinalRound = this.#getRoundAsHTMLElementT(i);
        let rightFinalRound = this.#getRoundAsHTMLElementT(i);

        if (team1Data)
            leftFinalRound.append(this.#getTeamNodeAsHTMLElement(team1Data, "normal"));
        if (team2Data)
            rightFinalRound.append(this.#getTeamNodeAsHTMLElement(team2Data, "normal"));

        this.#layoutContainer.leftSideBracketContainer.append(leftFinalRound);
        this.#layoutContainer.rightSideBracketContainer.append(rightFinalRound);
    }

    #fillMatchesWithDefaultValue() {

        let noOfRounds = Math.log2(this.#teams.length);
        let matchesNumberInRound = this.#teams.length / 2; //initially

        //fill matches with all roundes and matches
        for (let i = 1; i <= noOfRounds; ++i) {
            for (let f = 1; f <= matchesNumberInRound; ++f)//generate for both side
                this.#matches.push({ round: i, match: f, team1_id: null, team2_id: null, winner_id: null });

            matchesNumberInRound /= 2;
        }
    }

    /**
     * 
     * @returns {HTMLElement}
     */
    #getCupImageAsHTMLElement() {
        const cupImg = document.createElement("img");

        cupImg.src = "./images/mario-cup.webp";
        cupImg.classList.add("img-fluid", "z-1");
        cupImg.style.minWidth = '260px';

        return cupImg;
    }

    /**
     * get empty braket sid div
     * @param {string} dir direction can be left or right
     * @returns {HTMLElement}
     */
    #getBracketSideAsHTMLElement(id) {
        let sideDiv = document.createElement("section");
        sideDiv.classList.add("mt-5", "py-5", "d-flex", "align-items-center");

        sideDiv.id = id;

        return sideDiv;
    }

    /**
     * pass the round matches data and get round element contain all pairs
     * 
     * @param {object[]|null} roundMatchesData
     * @param {number} roundMatchesData.round as ex if we have 4 teams we will have 2 round
     * @param {number} roundMatchesData.match match number in the round 
     * @param {number|null} roundMatchesData.team1_id 
     * @param {number|null} roundMatchesData.team2_id 
     * @param {number|null} roundMatchesData.winner_id
     * @returns {HTMLElement}
     */
    #getRoundAsHTMLElement(roundMatchesData) {

        let roundUl = this.#getRoundAsHTMLElementT(roundMatchesData[0].round);

        roundMatchesData.forEach(match => {
            let team1Data = (match.team1_id) ? this.#teams.find(team => team.id === match.team1_id) : null;
            let team2Data = (match.team2_id) ? this.#teams.find(team => team.id === match.team2_id) : null;
            roundUl.append(this.#getPairAsHTMLElement(match.match, team1Data, team2Data));
        });

        return roundUl;
    }

    #getRoundAsHTMLElementT(roundNumber) {
        const roundUl = document.createElement("ul");

        roundUl.classList.add("round", "list-unstyled", "p-0", "mb-0", "position-relative");
        roundUl.setAttribute("round", roundNumber);

        return roundUl;
    }

    /**
    * @param {object} team1Data,team2Data
    * @property {number} id
    * @property {string} name
    * @property {string} image url of the image
    * @property {string} theme hexa color start with #
    * @param {number} matchNumber
    */
    #getPairAsHTMLElement(matchNumber, team1Data, team2Data) {
        const pairDiv = document.createElement("div");
        pairDiv.classList.add("pair", "position-relative");
        pairDiv.setAttribute("match", matchNumber);

        if (team1Data)
            pairDiv.appendChild(this.#getTeamNodeAsHTMLElement(team1Data, "top"));
        if (team2Data)
            pairDiv.appendChild(this.#getTeamNodeAsHTMLElement(team2Data, "bottom"));

        return pairDiv;
    }

    /**
    * @param {object} teamData
    * @param {number} teamData.id
    * @param {string} teamData.name
    * @param {string} teamData.image url of the image
    * @param {string} teamData.theme hexa color start with #
    * @param {string} type type can be normal top bottom
    */
    #getTeamNodeAsHTMLElement(teamData, type) {

        if (!teamData) return;

        // Create a div element for the team container
        const teamDiv = document.createElement("div");
        teamDiv.classList.add("team", "z-1", "d-flex", "align-items-center", "gap-3", "bg-white", "rounded", "p-2", "position-absolute", "translate-middle-y");
        teamDiv.id = teamData.id;

        if (type.toLowerCase() == 'top')
            teamDiv.classList.add("top-0", "translate-middle-y");
        else if (type.toLowerCase() == "bottom") {
            teamDiv.classList.remove("translate-middle-y");
            teamDiv.classList.add("bottom-0", "translate-middle-ny", "position-absolute");
        }

        // Create the img element for the team logo
        const teamImg = document.createElement("img");
        teamImg.classList.add("team__img");
        teamImg.src = teamData.image;
        teamImg.alt = "team logo";

        // Create the span element for the team name
        const teamNameSpan = document.createElement("span");
        teamNameSpan.classList.add("team__name", "text-capitalize", "fw-semibold", "w-100", "bg-white", "text-dark");

        let teamsNames = teamData.name.split(" ");
        let characterCounter = 0;
        for (let teamName of teamsNames) {
            if (characterCounter + teamName.length + 1 >= 27)
                break;
            teamNameSpan.textContent += teamName + " ";
            characterCounter += teamName.length + 1;//1 for space
        }

        //set theme color
        teamDiv.style.setProperty("--team-theme", teamData.theme);

        // Append the img and span to the team div
        teamDiv.appendChild(teamImg);
        teamDiv.appendChild(teamNameSpan);

        // Return the complete team div element
        return teamDiv;
    }

    /**
   * @param {object} match
   * @param {number} match.round as ex if we have 4 teams we will have 2 round
   * @param {number} match.match match number in the round 
   * @param {number} match.team1_id 
   * @param {number} match.team2_id 
   */
    #setMatchTeamsHelper(match) {
        const team1Data = this.#teams.find(team => team.id == match.team1_id);
        const team2Data = this.#teams.find(team => team.id == match.team2_id);

        //update matches at round match.round
        for (let matchItem of this.#matches) {
            if (matchItem.round === match.round && matchItem.match == match.match) {
                matchItem.team1_id = match.team1_id;
                matchItem.team2_id = match.team2_id;
            }
        }

        if (this.#isFinalRound(match.round)) {
            this.#setFinalMatch(team1Data, "left");
            this.#setFinalMatch(team2Data, "right");
            return;
        }

        let matchContainer = this.#layoutContainer.mainContainer.querySelector(`.round[round="${match.round}"] .pair[match="${match.match}"]`);
        matchContainer.innerHTML = "";

        if (team1Data)
            matchContainer.appendChild(this.#getTeamNodeAsHTMLElement(team1Data, "top"));
        if (team2Data)
            matchContainer.appendChild(this.#getTeamNodeAsHTMLElement(team2Data, "bottom"));
    }

    #setFinalMatch(teamData, side = 'left') {
        if (side == "left") {
            let leftFinalMatchContainer =
                this.#layoutContainer.leftSideBracketContainer.querySelector(`.round[round="${this.#getNumberOfRounds()}"]`);
            if (teamData) {
                let winnerNode = this.#getTeamNodeAsHTMLElement(teamData, "normal");
                leftFinalMatchContainer.appendChild(winnerNode);
            }
        }
        else {
            let rightFinalMatchContainer =
                this.#layoutContainer.rightSideBracketContainer.querySelector(`.round[round="${this.#getNumberOfRounds()}"]`);
            if (teamData) {
                let winnerNode = this.#getTeamNodeAsHTMLElement(teamData, "normal");
                rightFinalMatchContainer.appendChild(winnerNode);
            }
        }

        winnerNode.offsetHeight;
        winnerNode.classList.add("move");
    }

    /**
     * know if your round number is the final round or not
     * @param {number} roundNumber 
     * @returns {boolean}
     */
    #isFinalRound(roundNumber) {
        return this.#getNumberOfRounds() === roundNumber;
    }

    #getNumberOfRounds() {
        return Math.log2(this.#teams.length);
    }

    setMatchTeams(matchNumber, team1Id, team2Id) {
        this.#setMatchTeamsHelper({ round: 1, match: matchNumber, team1_id: team1Id, team2_id: team2Id });
    }

    setWinner(roundNumber, matchNumber, winnerTeamId) {
        for (let matchItem of this.#matches) {
            if (matchItem.round === roundNumber && matchItem.match === matchNumber)
                matchItem.winner_id = winnerTeamId;


            else if (matchItem.round === roundNumber + 1 && matchItem.match === Math.ceil(matchNumber / 2))
                if (matchItem.match % 2 == 1)
                    matchItem.team1_id = winnerTeamId;
                else
                    matchItem.team2_id = winnerTeamId;
        }

        const winnerTeamData = this.#getTeamDataById(winnerTeamId);

        if (this.#isFinalRound(roundNumber))
            (matchNumber % 2 == 1) ? this.#setFinalMatch(winnerTeamData, "left") :
                this.#setFinalMatch(winnerTeamData, "right");
        else {
            let matchContainer = this.#layoutContainer.mainContainer.querySelector(`.round[round="${roundNumber}"] .pair[match="${matchNumber}"]`);

            let winnerNode;
            if (matchNumber % 2 == 1)
                winnerNode = this.#getTeamNodeAsHTMLElement(winnerTeamData, "top");
            else
                winnerNode = this.#getTeamNodeAsHTMLElement(winnerTeamData, "bottom");

            matchContainer.appendChild(winnerNode);

            winnerNode.offsetHeight;
            winnerNode.classList.add("move");
        }
    }

    #getTeamDataById(teamId) {
        return this.#teams.find(team => team.id === teamId);
    }
};