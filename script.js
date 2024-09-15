document.addEventListener("DOMContentLoaded", async (event) => {

    let teams, matches;
    [teams, matches] = await Promise.all([fetchTeams(), fetchMatches()]);

    console.log(teams);
    console.log(matches);

    let bracket = new Bracket(document.querySelector("#bracket-container"), teams, matches);

    bracket.renderBracket();
});

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

    //
    renderBracket() {
        this.#layoutContainer.mainContainer.innerHTML = '';

        this.#layoutContainer.leftSideBracketContainer = this.#getBracketSide("bracket-left");
        this.#layoutContainer.rightSideBracketContainer = this.#getBracketSide("bracket-right");

        this.#layoutContainer.mainContainer.append(this.#layoutContainer.leftSideBracketContainer);
        this.#layoutContainer.mainContainer.append(this.#getCupImageAsHTMLElement());
        this.#layoutContainer.mainContainer.append(this.#layoutContainer.rightSideBracketContainer);

        //values just for one side
        let noOfMatches = this.#teams.length - 1;

        if (!this.#matches.length)
            this.#fillMatchesWithDefaultValue();

        let noOfRounds = Math.log2(this.#teams.length);
        //append round
        let i, matchesAtRoundI;
        for (i = 1; i < noOfRounds; ++i) {
            matchesAtRoundI = this.#matches.filter(match => match.round === i);

            //matchesAtRoundI will contain all matches in both side so we need to divid them
            this.#layoutContainer.leftSideBracketContainer.append(this.#getRound(matchesAtRoundI.slice(0, matchesAtRoundI.length / 2)));
            this.#layoutContainer.rightSideBracketContainer.append(this.#getRound(matchesAtRoundI.slice(matchesAtRoundI.length / 2)));
        }

        //add final match
        matchesAtRoundI = this.#matches.filter(match => match.round === i);

        let team1Data = this.#teams.find(team => team.id === matchesAtRoundI[0].team1_id);
        let team2Data = this.#teams.find(team => team.id === matchesAtRoundI[0].team2_id);


        if (!team1Data || !team2Data) return;;

        this.#layoutContainer.leftSideBracketContainer.append(this.#getTeamNodeAsHTMLElement(team1Data, "normal"));
        this.#layoutContainer.rightSideBracketContainer.append(this.#getTeamNodeAsHTMLElement(team2Data, "normal"));
    }

    #fillMatchesWithDefaultValue() {

        let noOfRounds = Math.log2(this.#teams.length);
        let teamsNumberInRound = this.#teams.length / 2; //for one side

        //fill matches with all roundes and matches
        for (let i = 1; i <= noOfRounds; ++i) {
            for (let f = 1; f <= teamsNumberInRound * 2; ++f)//generate for both side
                this.#matches.push({ round: i, match: f, team1_id: null, team2_id: null, winner_id: null });

            teamsNumberInRound /= 2;
        }
    }

    #getCupImageAsHTMLElement() {
        const cupImg = document.createElement("img");

        cupImg.src = "./images/mario-cup.webp";
        cupImg.classList.add("img-fluid", "z-1");
        cupImg.style.minWidth = '260px';

        return cupImg;
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
        // Create a div element for the team container
        const teamDiv = document.createElement("div");
        teamDiv.classList.add("team", "z-1", "d-flex", "align-items-center", "gap-3", "bg-white", "rounded", "p-2", "position-relative");
        if (type.toLowerCase() == 'top')
            teamDiv.classList.add("top-0", "translate-middle-y");
        else if (type.toLowerCase() == "bottom") {
            teamDiv.classList.remove("position-relative");
            teamDiv.classList.add("bottom-0", "translate-middle-ny", "position-absolute");
        }


        // Create the img element for the team logo
        const teamImg = document.createElement("img");
        teamImg.classList.add("team__img");
        teamImg.src = teamData.image;
        teamImg.alt = "team logo";

        // Create the span element for the team name
        const teamNameSpan = document.createElement("span");
        teamNameSpan.classList.add("team__name", "text-uppercase", "fw-semibold", "w-100", "bg-white", "text-dark");
        teamNameSpan.textContent = teamData.name; // Use teamData for the team name

        //set theme color
        teamDiv.style.setProperty("--team-theme", teamData.theme);

        // Append the img and span to the team div
        teamDiv.appendChild(teamImg);
        teamDiv.appendChild(teamNameSpan);

        // Return the complete team div element
        return teamDiv;
    }
};