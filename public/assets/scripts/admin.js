import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { database } from "./firebaseConfig.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = './login.html';
            return;
        }

        const [rounds, teams] = await Promise.all([
            getDataFromPath("rounds"),
            getDataFromPath("teams"),
        ]);

        const roundUi = new RoundUi(document.querySelector("#rounds"), teams, rounds);

        roundUi.renderDashboard();
    });
});

class RoundUi {
    #container;
    #teams;
    #rounds;

    /**
     * @param {HTMLElement} container
     * @param {object[]} teams 
     * @param {number} teams.id
     * @param {string} teams.image
     * @param {string} teams.name
     * @param {object[]} rounds
     * @param {number} rounds.round
     * @param {object[]} rounds.matches
     * @param {number} rounds.matches.match;
     * @param {number} rounds.matches.team1_id;
     * @param {number} rounds.matches.team2_id;
     * @param {number} rounds.matches.winner_id;
     */
    constructor(container, teams, rounds) {
        this.#container = container;
        this.#teams = teams;
        this.#rounds = rounds;
    }

    renderDashboard() {
        this.#rounds.forEach(round => {
            const roundUi = this.#getRoundUi(round.round, round.matches);
            this.#container.appendChild(roundUi);
        });
        this.#handelSelectionChange();
        this.#handelWinners();
    }

    #handelWinners() {
        this.#container.addEventListener("click", event => {
            if (event.target.matches(".is-winner")) {
                const round = event.target.closest(".round");
                const match = event.target.closest(".match-card");
                let winnerBtns = match.querySelectorAll(".is-winner");

                if (event.target.checked) {
                    if (event.target === winnerBtns[0])
                        winnerBtns[1].checked = false;
                    else
                        winnerBtns[0].checked = false

                    this.#setWinner(Number(round.dataset.round), Number(match.dataset.match), Number(event.target.value));
                }
                else {
                    this.#setWinner(Number(round.dataset.round), Number(match.dataset.match), -1);
                }
            }
        });
    }

    #setWinner(roundNumber, matchNumber, winnerId) {
        const round = this.#rounds.find(r => r.round === roundNumber);

        if (!round) return;

        let match = round.matches.find(m => m.match == matchNumber);

        if (!match) return;

        match.winner_id = winnerId;
        updateDatabaseValue(`rounds/${roundNumber - 1}/matches/${matchNumber - 1}/winner_id`, winnerId);

        if (roundNumber >= this.#rounds.length) return;

        console.log(roundNumber + 1, Math.ceil(matchNumber / 2), winnerId, matchNumber % 2 == 1 ? 1 : 2);
        this.#updateTeamsAtMatch(roundNumber + 1, Math.ceil(matchNumber / 2), winnerId, matchNumber % 2 == 1 ? 1 : 2);

        const matchAtNextRound = document.querySelector(`.round[data-round='${roundNumber + 1}'] .match-card[data-match='${Math.ceil(matchNumber / 2)}']`);
        const TeamsCardAtNextRoundAtMacthX = matchAtNextRound.querySelectorAll(".team-card");
        const winnerTeamCard = (matchNumber % 2 == 1 ? TeamsCardAtNextRoundAtMacthX[0] : TeamsCardAtNextRoundAtMacthX[1]);
        winnerTeamCard.dataset.team = winnerId;
        this.#updateOptions(winnerTeamCard, this.#teams.filter(team => team.winner_id === winnerId));
        this.#updateTeamImgBaseOnTeamCardId(winnerTeamCard);
        this.#handelWinnerButtonDisable(matchAtNextRound);
    }

    /**
     * if select value change, change team icon and update all available team for the rest
     */
    #handelSelectionChange() {
        this.#container.addEventListener("change", event => {
            if (event.target.matches(".team-card select")) {
                const matchCard = event.target.closest('.match-card');
                const teamCard = event.target.closest('.team-card');
                teamCard.dataset.team = event.target.value;
                this.#updateTeamImgBaseOnTeamCardId(teamCard);
                let pos = (matchCard.firstElementChild === teamCard ? 1 : 2);
                const teamId = teamCard.dataset.team !== "default" ? Number(teamCard.dataset.team) : null;
                this.#updateTeamsAtMatch(1, Number(matchCard.dataset.match), teamId, pos);
                this.#updateOptionsForAllSelectionOnRound1();
                this.#handelWinnerButtonDisable(matchCard);
            }
        });
    }

    #handelWinnerButtonDisable(matchCard) {
        if (!matchCard) return;

        const teams = Array.from(matchCard.querySelectorAll(".team-card"));

        const activeTeams = teams.filter(team => team.dataset.team != 'default');

        if (activeTeams.length == 2)
            teams.forEach(team => {
                const winnerCheck = team.querySelector("input[type='checkbox']");
                winnerCheck.disabled = false;
            });
        else
            teams.forEach(team => {
                const winnerCheck = team.querySelector("input[type='checkbox']");
                winnerCheck.disabled = true;
                winnerCheck.checked = false;
            });
    }

    /**
     * update all teams options with free option
     */
    #updateOptionsForAllSelectionOnRound1() {
        const teams = this.#container.querySelectorAll("#round-1 .team-card");
        teams.forEach(team => {
            this.#updateOptions(team, this.#getAvailabelTeamsOnRound(1));
        });
    }

    #unwinall(roundNumber, matchNumber) {

    }

    /**
     * update option for on team with free option
     * @param {HTMLElement} teamCard 
     */
    #updateOptions(teamCard, availableTeamsData) {
        const selectEl = teamCard.querySelector("select");
        //change button also
        teamCard.querySelector("input").value = teamCard.dataset.team;

        const availableTeamsCopy = availableTeamsData.slice();
        if (teamCard.dataset.team !== 'default')
            availableTeamsCopy.push(this.#getTeamDataById(Number(teamCard.dataset.team)));

        const newOptions = this.#getTeamOptionsUi(availableTeamsCopy, Number(teamCard.dataset.team));
        selectEl.innerHTML = '';
        newOptions.forEach(option => { selectEl.appendChild(option) });
    }

    /**
     * 
     * @param {number} roundNumber 
     * @param {number} teamId 
     */
    #updateTeamsAtMatch(roundNumber, matchNumber, teamId, teamPos = 1) {
        const round = this.#rounds.find(r => r.round === roundNumber);

        if (!round) return;
        let match = round.matches.find(m => m.match == matchNumber);

        if (!match) return;

        if (teamPos === 1) {
            match.team1_id = teamId;
            updateDatabaseValue(`rounds/${roundNumber - 1}/matches/${matchNumber - 1}/team1_id`, teamId);
        }
        else {
            match.team2_id = teamId;
            updateDatabaseValue(`rounds/${roundNumber - 1}/matches/${matchNumber - 1}/team2_id`, teamId);
        }
    }

    /**
     * @param {number} roundNumber
     * @param {object[]} matches 
     * @param {number} matches.match
     * @param {number} matches.team1_id
     * @param {number} matches.team2_id
     * @param {number} matches.winner_id
     */
    #getRoundUi(roundNumber, matches) {
        // Create accordion container
        const accordionContainer = document.createElement('div');
        accordionContainer.classList.add('accordion', 'shadow-sm', "mb-4", "rounded");
        accordionContainer.setAttribute('id', `round-${roundNumber}-accordion`);

        // Create accordion item
        const accordionItem = document.createElement('div');
        accordionItem.classList.add('accordion-item');

        // Create accordion header
        const accordionHeader = document.createElement('h2');
        accordionHeader.classList.add('accordion-header');

        // Create accordion button
        const accordionButton = document.createElement('button');
        accordionButton.classList.add('accordion-button', 'text-capitalize', 'fw-semibold', roundNumber === 1 ? null : 'collapsed');
        accordionButton.setAttribute('type', 'button');
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', `#round-${roundNumber}`);
        accordionButton.setAttribute('aria-expanded', roundNumber == 1 ? "true" : "false");
        accordionButton.setAttribute('aria-controls', `collapse-${roundNumber}`);
        accordionButton.textContent = `round ${roundNumber}`;

        // Create collapse container
        const collapseDiv = document.createElement('div');
        collapseDiv.classList.add('accordion-collapse', 'collapse', roundNumber == 1 ? 'show' : null);
        collapseDiv.setAttribute('id', `round-${roundNumber}`);
        collapseDiv.setAttribute('data-bs-parent', `#round-${roundNumber}-accordion`);

        // Create accordion body
        const accordionBody = document.createElement('div');
        accordionBody.classList.add('accordion-body', 'py-5', 'text-capitalize', "round");
        accordionBody.dataset.round = roundNumber;

        // Create row inside the accordion body
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row', 'row-cols-1', 'row-cols-lg-3', 'gy-4');

        matches.forEach(match => {
            const matchCard = this.#getMatchUi(
                {
                    number: match.match,
                    teamsData: [this.#getTeamDataById(match.team1_id),
                    this.#getTeamDataById(match.team2_id)],
                    winner_id: match.winner_id
                },
                roundNumber
            );

            this.#handelWinnerButtonDisable(matchCard);
            rowDiv.append(matchCard);
        });

        // Append elements to their respective parents
        accordionBody.appendChild(rowDiv);
        collapseDiv.appendChild(accordionBody);
        accordionHeader.appendChild(accordionButton);
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(collapseDiv);
        accordionContainer.appendChild(accordionItem);

        return accordionContainer;
    }

    #updateTeamImgBaseOnTeamCardId(teamCard) {
        let newImage;
        if (teamCard.dataset.team != 'default') {
            const selectedTeamData = this.#getTeamDataById(teamCard.dataset.team);
            newImage = "teams-logos/";
            newImage += selectedTeamData.image;
        }
        else {
            newImage = "question-mark.png";
        }

        teamCard.querySelector("img").src = "../assets/images/" + newImage;
    }

    /**
     * @param {object[]} matchData array of object contain two teams data
     * @param {number} matchData.number
     * @param {number} matchData.winner_id
     * @param {object[]} matchData.teamsData
     * @param {string} matchData.teamsData.image
     * @param {name} matchData.teamsData.name
     * @param {number} matchData.teamsData.id
     * @param {number} roundNumber
     * @returns {HTMLElement}
     */

    #getMatchUi(matchData, roundNumber) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const matchCardDiv = document.createElement('div');
        matchCardDiv.className = 'match-card position-relative shadow-sm p-3 rounded d-flex justify-content-between align-items-center gap-4 bg-body-secondary';
        matchCardDiv.dataset.match = matchData.number;

        const textDiv = document.createElement('div');
        textDiv.className = 'text-uppercase fs-3';
        textDiv.textContent = 'vs';

        matchCardDiv.appendChild(this.#getTeamUi(matchData.teamsData[0],
            roundNumber, matchData.teamsData[0] && matchData.teamsData[0].id == matchData.winner_id));
        matchCardDiv.appendChild(textDiv);
        matchCardDiv.appendChild(this.#getTeamUi(matchData.teamsData[1], roundNumber,
            matchData.teamsData[1] && matchData.teamsData[1].id == matchData.winner_id));

        colDiv.appendChild(matchCardDiv);

        return colDiv;
    }

    /**
     * get select options of teams as HTML Element wrappered in div
     * @param {object[]} teamsOptionsData 
     * @param {object[]} teamsOptionsData.id
     * @param {object[]} teamsOptionsData.name
     * @returns {HTMLElement} 
     */
    #getTeamOptionsUi(teamsOptionsData, teamId) {

        if (!teamsOptionsData) return;

        teamsOptionsData.unshift({ id: "default", name: "select team" });

        const teamsOptionsElements = [];

        teamsOptionsData.forEach((team) => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (team.id == teamId)
                option.selected = true;
            teamsOptionsElements.push(option);
        });

        return teamsOptionsElements;
    }

    #getTeamDataById(teamId) {
        return this.#teams.find(team => team.id == teamId);
    }

    /**
     * @param {number} roundNumber
     * @returns {object[]}
     */
    #getAvailabelTeamsOnRound(roundNumber) {

        const round = this.#rounds.find(r => r.round === roundNumber);
        if (!round) return;

        const participatingTeams = [];

        round.matches.forEach(matche => {
            if (matche.team1_id != null) participatingTeams.push(matche.team1_id);
            if (matche.team2_id != null) participatingTeams.push(matche.team2_id);
        });

        return this.#teams.filter(
            team => !participatingTeams.includes(team.id)
        );
    }

    /**
     * 
     * @param {object} teamData 
     * @param {string} img complete path
     * @param {string} name 
     * @param {number} id
     * @param {number} roundNumber
     * @returns {HTMLElement}
     */
    #getTeamUi(teamData, roundNumber, isWinner = false) {
        // Create the team card div
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card text-center';
        teamCard.dataset.team = (teamData) ? teamData.id : "default";

        // Create the team logo image
        const img = document.createElement('img');
        img.width = 60;
        img.src = `../assets/images/${(teamData) ? "teams-logos/" + teamData.image : 'question-mark.png'}`;
        img.alt = teamData ? teamData.name : "default";
        img.className = 'img-fluid';
        teamCard.appendChild(img);

        // Create the select dropdown
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm mt-2 text-capitalize';
        select.disabled = roundNumber != 1;
        let availableTeamAtThisRound = this.#getAvailabelTeamsOnRound(roundNumber);
        if (teamData)
            availableTeamAtThisRound.push(this.#getTeamDataById(teamData.id));
        const teamsOptionsUi = this.#getTeamOptionsUi(availableTeamAtThisRound, teamData ? teamData.id : 'default');
        teamsOptionsUi.forEach(team => { select.append(team); });
        teamCard.appendChild(select);

        // Create the toggle switch
        const label = document.createElement('label');
        label.className = 'switch mt-3';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.classList.add("is-winner");
        input.checked = isWinner;
        input.disabled = true;
        input.value = teamData ? teamData.id : "default";
        const span = document.createElement('span');
        span.className = 'slider rounded-pill';
        label.appendChild(input);
        label.appendChild(span);
        teamCard.appendChild(label);

        return teamCard;
    }
}

async function getDataFromPath(path) {
    try {
        const dbRef = ref(database, path); // Create a reference to the provided path
        const snapshot = await get(dbRef); // Get the data once

        if (snapshot.exists()) {
            return snapshot.val(); // Return the data if it exists
        } else {
            console.log("No data available at the provided path.");
            return null;
        }
    } catch (error) {
        console.error("Error retrieving data:", error);
        return null;
    }
}

function updateDatabaseValue(path, value) {
    const reference = ref(database, path);
    return set(reference, value)
        .catch((error) => {
            console.log(`Error updating ${path}`, error);
        });
}