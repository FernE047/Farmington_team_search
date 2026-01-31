const API_BASE = "https://www.speedrun.com/api/v";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let isSearching = false;

const user_input = document.getElementById("user_input");
user_input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") search();
});
const button = document.getElementById("button");
const tbody = document.getElementById("hungry table");

const user = {
    name: "",
    id: "",
};

function reset_user() {
    user.name = "";
    user.id = "";
}

function deactivate_button() {
    isSearching = true;
    button.disabled = true;
}

function activate_button() {
    isSearching = false;
    button.disabled = false;
}

async function validate() {
    const name = user_input.value.trim();
    user.name = name;
    if (!name) {
        alert("Por favor, digite o nome do player!");
        user_input.focus();
        return false;
    }
    deactivate_button();

    try {
        const userUrl = `${API_BASE}1/users/${encodeURIComponent(user.name)}`;
        const userResponse = await fetch(userUrl);
        await sleep(1000);

        if (userResponse.status === 404) {
            alert(`Error: Player "${user.name}" could not be found.`);
            user_input.focus();
            return false;
        }

        if (!userResponse.ok) {
            throw new Error(
                `API User Check failed with status: ${userResponse.status}`,
            );
        }

        const userData = await userResponse.json();
        user.id = userData.data.id;
    } catch (error) {
        console.error("Error fetching user runs:", error);
        alert(`Error: User "${user.name}" could not be found.`);
        return false;
    }
    return true;
}

async function fetch_runs() {
    try {
        const runsResponse = await fetch(
            `https://www.speedrun.com/api/v2/GetUserLeaderboard?userId=${user.id}`,
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!runsResponse.ok) {
            throw new Error(
                `API Fetch failed with status: ${runsResponse.status}`,
            );
        }

        const searchData = await runsResponse.json();
        const coop_runs = searchData.runs.filter(
            (run) => run.playerIds.length > 1,
        );
        const player_names = {};
        searchData.players.forEach((player) => {
            player_names[player.id] = player.name;
        });
        const teams = {};
        coop_runs.forEach((run) => {
            const team_ids = run.playerIds.sort();
            const team_id = team_ids.join(" ");
            if (!teams[team_id])
                teams[team_id] = {
                    team_names: team_ids.map((id) => player_names[id]),
                    count: 0,
                };
            teams[team_id].count += 1;
        });
        // add teams to the table
        tbody.innerHTML = "";
        teams_sorted = Object.fromEntries(
            Object.entries(teams).sort(([, a], [, b]) => b.count - a.count),
        );
        for (const [_, data] of Object.entries(teams_sorted)) {
            const tr = document.createElement("tr");
            const teamTd = document.createElement("td");
            teamTd.innerText = data.team_names.join(", ");
            const countTd = document.createElement("td");
            countTd.innerText = data.count;
            tr.appendChild(teamTd);
            tr.appendChild(countTd);
            tbody.appendChild(tr);
        }
    } catch (error) {
        console.error("Erro durante a busca de runs:", error);
        alert("erro na API");
    }
}

function show_results() {
    cats.forEach((cat) => {
        rows[cat].innerText = user[cat];
    });
}

async function search() {
    reset_user();
    if (!(await validate())) return activate_button();
    await fetch_runs();
    activate_button();
}
