const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjToResponseObj = (stateObj) => {
  return {
    stateId: stateObj.state_id,
    stateName: stateObj.state_name,
    population: stateObj.population,
  };
};

const convertDistObjToResponseObj = (distObj) => {
  return {
    districtId: distObj.district_id,
    districtName: distObj.district_name,
    stateId: distObj.state_id,
    cases: distObj.cases,
    cured: distObj.cured,
    active: distObj.active,
    deaths: distObj.deaths,
  };
};

//Get states list API

app.get("/states/", async (request, response) => {
  const getStateListQuery = `
        SELECT * 
        FROM state;
    `;
  const statesList = await db.all(getStateListQuery);
  response.send(
    statesList.map((eachState) => convertDbObjToResponseObj(eachState))
  );
});

//Get state API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT *
        FROM state
        WHERE
        state_id = ${stateId};
    `;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjToResponseObj(state));
});

//Add district API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
        INSERT INTO district
        (district_name,state_id,cases,cured,active,deaths)
        VALUES
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// Get district API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `

        SELECT*
        FROM district
        WHERE
        district_id = ${districtId};
    `;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistObjToResponseObj(district));
});

//Delete district API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `

        DELETE FROM district
        WHERE
        district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update district API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE district
        SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths  = ${deaths}
        WHERE
        district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get total data API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalDataQuery = `
        SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district
        WHERE
        state_id = ${stateId};
    `;
  const totalData = await db.get(getTotalDataQuery);
  response.send(totalData);
});

//Get state name based on the district id API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
        SELECT 
        state.state_name AS stateName
        FROM state
        INNER JOIN district
        ON state.state_id = district.state_id
        WHERE
        district.district_id = ${districtId};
    `;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});

module.exports = app;
