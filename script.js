document.addEventListener("DOMContentLoaded", (event) => {

    let bracket = new Bracket(document.querySelector("#bracket-container"), 16);


});

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
     * @type {number} teamsNumber
     */
    #teamsNumber

    /**
     * @typedef {object} layoutContainer
     * @property {HTMLElement} mainContainer
     * @property {HTMLElement} leftSideBracketContainer
     * @property {HTMLElement} rightSideBracketContainer
     */
    #layoutContainer;

    /**
     * @param {HTMLElement} container  where bracket should append
     * @param {number} teamsNumber
     * @returns {void}
     */
    constructor(container, teamsNumber) {
        this.#layoutContainer.mainContainer = container;
        this.#teamsNumber = teamsNumber;
        this.#teams = [];
        this.#matches = [];
    }

    //
    renderBracket() {
        this.#layoutContainer.mainContainer.innerHTML = '';

        this.#layoutContainer.leftSideBracketContainer = this.#getBracketSide("bracket-left");
        this.#layoutContainer.rightSideBracketContainer = this.#getBracketSide("bracket-right");

        this.#layoutContainer.mainContainer.append(this.#layoutContainer.leftSideBracketContainer);
        this.#layoutContainer.mainContainer.append(this.#layoutContainer.rightSideBracketContainer);

        //values just for one side
        let noOfMatches = this.#teamsNumber - 1;

        if (!this.#matches.length)
            this.#fillMatchesWithDefaultValue();

        //append round
        for (let i = 1; i <= noOfRounds; ++i) {
            let matchesAtRoundI = this.#matches.filter(match => match.round === i);
            //matchesAtRoundI will contain all matches in both side so we need to divide them
            this.#layoutContainer.leftSideBracketContainer.append(this.#getRound(matchesAtRoundI.slice(0, matchesAtRoundI.length / 2)));
            this.#layoutContainer.rightSideBracketContainer.append(this.#getRound(matchesAtRoundI.slice(matchesAtRoundI.length / 2)));
        }
    }

    #fillMatchesWithDefaultValue() {

        let noOfRounds = Math.log2(this.#teamsNumber);
        let teamsNumberInRound = this.#teamsNumber / 2; //for one side

        //fill matches with all roundes and matches
        for (let i = 1; i <= noOfRounds; ++i) {
            for (let f = 1; f <= teamsNumberInRound * 2; ++f)//generate for both side
                this.#matches.push({ round: i, match: f, team1_id: null, team2_id: null, winner_id: null });

            teamsNumberInRound /= 2;
        }
    }

    /**
     * 
     * @param {string} id element id
     * @returns {HTMLElement}
     */
    #getBracketSide(id) {
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
    #getRound(roundMatchesData) {
        const roundUl = document.createElement("ul");

        roundUl.classList.add("round", "list-unstyled", "p-0", "mb-0");

        roundMatchesData.forEach(match => {
            let team1Data = (match.team1_id) ? this.#teams.find(team => team.id === match.team1_id) : null;
            let team2Data = (match.team2_id) ? this.#teams.find(team => team.id === match.team2_id) : null;
            roundUl.append(this.#getPairAsHTMLElement(team1Data, team2Data));
        });

        return roundUl;
    }

    /**
    * @param {object} team1Data,team2Data
    * @property {number} id
    * @property {string} name
    * @property {string} image url of the image
    * @property {string} theme hexa color start with #
    */
    #getPairAsHTMLElement(team1Data, team2Data) {
        const pairDiv = document.createElement("div");
        pairDiv.classList.add("pair", "position-relative", "rounded");

        if (team1Data)
            pairDiv.appendChild(this.#getTeamNodeAsHTMLElement(team1Data));
        if (team2Data)
            pairDiv.appendChild(this.#getTeamNodeAsHTMLElement(team2Data));

        return pairDiv;
    }

    /**
    * @param {object} teamData
    * @property {number} id
    * @property {string} name
    * @property {string} image url of the image
    * @property {string} theme hexa color start with #
    */
    #getTeamNodeAsHTMLElement(teamData) {
        // Create a div element for the team container
        const teamDiv = document.createElement("div");
        teamDiv.classList.add("team", "d-flex", "align-items-center", "gap-3", "bg-main", "rounded", "p-2", "position-relative", "top-0", "translate-middle-y");

        // Create the img element for the team logo
        const teamImg = document.createElement("img");
        teamImg.classList.add("team__img");
        teamImg.src = teamData.image;
        teamImg.alt = "team logo";

        // Create the span element for the team name
        const teamNameSpan = document.createElement("span");
        teamNameSpan.classList.add("team__name", "text-uppercase", "fw-semibold");
        teamNameSpan.textContent = teamData.name; // Use teamData for the team name

        //set theme color

        // Append the img and span to the team div
        teamDiv.appendChild(teamImg);
        teamDiv.appendChild(teamNameSpan);

        // Return the complete team div element
        return teamDiv;
    }
};