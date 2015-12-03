/*
  Background code for options.html
  Author: vabene1111

*/
var userSeriesList = [];
var userSettings = {};
var newEpisodes = [];
var popup = true;


document.addEventListener('DOMContentLoaded', function() {

    var fileName = location.href.split("/").slice(-1);
    if (fileName == "options.html" || fileName == "options.html#") {
        popup = false;
    }

    loadData();
    loadSettings();

    //click imdb search
    document.getElementById('btn_getImdbData').addEventListener('click', getImdbData);
    document.getElementById('btn_clearStorage').addEventListener('click', clearStorage);

    //import/export
    document.getElementById('btn_exportJSON').addEventListener('click', exportJSON);
    document.getElementById('btn_importJSON').addEventListener('click', importJSON);

    //settings
    document.getElementById('check_setting_incognito').addEventListener('change', settingsChanged);


});

function searchNew() {

    for (i = 0; i < userSeriesList.length; i++) {

        var searchUrl = "http://www.omdbapi.com/?i=" + userSeriesList[i].imdbID + "&Season=" + userSeriesList[i].Season;
        console.log(searchUrl);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", searchUrl, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                var jsObj = JSON.parse(this.responseText);

                var lPos = jsObj.Episodes.length - 1;
                var date = new Date(String(jsObj.Episodes[lPos].Released));

                document.getElementById('lbl_newEpisode_' + this.data).innerHTML = date.toLocaleDateString() + " - " + jsObj.Episodes[lPos].Episode;
            }
        }
        xhr.data = i;
        xhr.send();

    }

}

function loadSettings() {
    chrome.storage.sync.get("user_settings", function(obj) {
        if (typeof obj.user_settings === 'undefined' || obj.user_settings === null) {
            userSettings = {
                "incognito": 0
            };
        } else {
            userSettings = obj.user_settings;

            document.getElementById('check_setting_incognito').checked = userSettings.incognito;

        }
    });
}

function settingsChanged() {
    var setting_incognito = document.getElementById('check_setting_incognito').checked;
    userSettings.incognito = setting_incognito;

    chrome.storage.sync.set({
        'user_settings': userSettings
    }, function() {
        //not really do anything anytime you save
    });

}



function getImdbData(e) {
    //parse userinput and create API Url tt0364845
    var imdbId = document.getElementById("in_seriesId").value;

    var url = "http://www.omdbapi.com/?i=" + imdbId + "&plot=short&r=json";


    //initiate XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            imdbCallback(xhr.responseText);
        }
    }
    xhr.send();

}

function loadData() {
    chrome.storage.sync.get("series_list", function(obj) {
        if (typeof obj.series_list === 'undefined' || obj.series_list === null) {
            userSeriesList = [];
        } else {
            userSeriesList = obj.series_list;
        }

        chrome.storage.sync.getBytesInUse(function(bytes) {
            document.getElementById('lbl_imdbJsonIds').innerHTML = "Bytes: " + bytes + " Count: " + userSeriesList.length;
        })

        table = document.getElementById('tbl_series');
        if (popup) {
            table.innerHTML = "";
        } else {
            table.innerHTML = "<thead><td>Img</td><td>Description</td><td>Action</td><td>Tracker</td><td>Open</td></thead>";
        }


        for (i = 0; i < userSeriesList.length; i++) {
            var row = document.createElement('tr');

            //poster
            var cell_img = document.createElement('td');
            var img = document.createElement("img");
            img.setAttribute('src', userSeriesList[i].Poster);
            if (popup) {
                img.setAttribute('height', '64px');

            } else {
                img.setAttribute('height', '128px');
                cell_img.setAttribute('width', '91px');
            }
            cell_img.appendChild(img);

            //info
            var cell_info = document.createElement('td');
            cell_info.innerHTML = "Title: " + userSeriesList[i].Title + "<br/>IMDB Id: <a target='_blank' href='http://www.imdb.com/title/" + userSeriesList[i].imdbID + "/'>" + userSeriesList[i].imdbID + "</a><br/> <label id='lbl_newEpisode_" + i + "'> nichts neues</label>";

            //delete/url button
            var cell_delete = document.createElement('td');
            cell_delete.innerHTML = "<button id='btn_delete_" + i + "' class='btn btn-danger'>Delete</button> <button id='btn_setUrl_" + i + "' class='btn btn-success'>Set URL</button>";

            //episode + season tracker
            var cell_tracker = document.createElement('td');

            cell_tracker.innerHTML = " <div class='row'> " +
                "<div class='form-inline'>" +
                "<button class='btn' id='btn_season_sub_" + i + "'>-</button>" +
                "<input type='text' class='form-control' id='in_curSeason_" + i + "' value='" + userSeriesList[i].Season + "' size='4'>" +
                "<button class='btn' id='btn_season_add_" + i + "'>+</button>" +
                "</div>" +

                "<div class='form-inline'>" +
                "<button class='btn' id='btn_episode_sub_" + i + "'>-</button>" +
                "<input type='text' class='form-control' id='in_curEpisode_" + i + "' value='" + userSeriesList[i].Episode + "' size='4'>" +
                "<button class='btn' id='btn_episode_add_" + i + "'>+</button>" +
                "</div>" +
                "</div>";

            //delete button
            var cell_favURL = document.createElement('td');
            cell_favURL.innerHTML = "<button id='btn_open_" + i + "' class='btn btn-info'>Open</button>";

            row.appendChild(cell_img);
            row.appendChild(cell_info);
            if (!popup) {
                row.appendChild(cell_delete);
            }
            row.appendChild(cell_tracker);
            row.appendChild(cell_favURL);
            table.appendChild(row);

            if (!popup) {
                document.getElementById('btn_delete_' + i).addEventListener('click', tableDeleteClick);
                document.getElementById('btn_setUrl_' + i).addEventListener('click', tableSetUrlClick);
            }

            document.getElementById('btn_season_add_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_season_sub_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_episode_add_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_episode_sub_' + i).addEventListener('click', tableTrackerClick);

            document.getElementById('btn_open_' + i).addEventListener('click', openFavURL);

            document.getElementById('in_curEpisode_' + i).addEventListener('keyup', tableEpisodeChange);
            document.getElementById('in_curSeason_' + i).addEventListener('keyup', tableSeasonChange);
        }

        //get all new episodes
        searchNew();
    });

}

function openFavURL() {
    var btn_id = this.id;
    var i = btn_id.replace('btn_open_', '');

    if (userSettings.incognito) {
        chrome.windows.create({
            "url": userSeriesList[i].favURL,
            "incognito": true
        });
    } else {
        chrome.tabs.create({
            "url": userSeriesList[i].favURL
        });
    }
}

function tableSeasonChange() {
    var btn_id = this.id;
    var i = btn_id.replace('in_curSeason_', '');

    var entry = userSeriesList[i];
    entry.Season = this.value;
    userSeriesList[i] = entry;
    saveChanges();
    loadData();

}

function tableEpisodeChange() {
    var btn_id = this.id;
    var i = btn_id.replace('in_curEpisode_', '');

    var entry = userSeriesList[i];
    entry.Episode = this.value;
    userSeriesList[i] = entry;
    saveChanges();
    loadData();
}

function tableTrackerClick() {
    var btn_id = this.id;

    if (btn_id.indexOf("btn_season_add_") != -1) {
        var i = btn_id.replace('btn_season_add_', '');
        var entry = userSeriesList[i];
        entry.Season = parseInt(entry.Season) + 1;
        userSeriesList[i] = entry;
        saveChanges();
        loadData();

    } else if (btn_id.indexOf("btn_season_sub_") != -1) {
        var i = btn_id.replace('btn_season_sub_', '');
        var entry = userSeriesList[i];
        entry.Season = parseInt(entry.Season) - 1;
        userSeriesList[i] = entry;
        saveChanges();
        loadData();

    } else if (btn_id.indexOf("btn_episode_add_") != -1) {
        var i = btn_id.replace('btn_episode_add_', '');
        var entry = userSeriesList[i];
        entry.Episode = parseInt(entry.Episode) + 1;
        userSeriesList[i] = entry;
        saveChanges();
        loadData();

    } else if (btn_id.indexOf("btn_episode_sub_") != -1) {
        var i = btn_id.replace('btn_episode_sub_', '');
        var entry = userSeriesList[i];
        entry.Episode = parseInt(entry.Episode) - 1;
        userSeriesList[i] = entry;
        saveChanges();
        loadData();

    }
}

function tableDeleteClick(e) {
    var btn_id = this.id;
    var seriesPos = btn_id.replace('btn_delete_', '');

    userSeriesList.splice(seriesPos, 1);

    saveChanges();
    loadData();
}

function tableSetUrlClick(e) {
    var btn_id = this.id;
    var i = btn_id.replace('btn_setUrl_', '');

    var favURL = prompt("Please enter the URL u wish to open when clicking the series image.", userSeriesList[i].favURL);
    if (favURL != null) {

        var entry = userSeriesList[i];
        entry.favURL = favURL;
        userSeriesList[i] = entry;
        saveChanges();
        loadData();
    }


}

function saveChanges() {

    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set({
        'series_list': userSeriesList
    }, function() {
        //not really do anything anytime you save
    });
}

function imdbCallback(jsonString) {
    var jsonObject = JSON.parse(jsonString);

    /*
    Information we get from the JSON Api:
    {"Title":"NCIS",
    "Year":"2003–",
    "Rated":"TV-14",
    "Released":"23 Sep 2003",
    "Runtime":"60 min",
    "Genre":"Action, Comedy, Crime",
    "Director":"N/A",
    "Writer":"Donald P. Bellisario, Don McGill",
    "Actors":"Mark Harmon, Michael Weatherly, Pauley Perrette, David McCallum",
    "Plot":"The cases of the Naval Criminal Investigative Service's Washington DC Major Case Response Team, led by Special Agent Leroy Jethro Gibbs.",
    "Language":"English",
    "Country":"USA",
    "Awards":"Nominated for 3 Primetime Emmys. Another 18 wins & 26 nominations.",
    "Poster":"http://ia.media-imdb.com/images/M/MV5BMTYyMTQ0MTU1OF5BMl5BanBnXkFtZTcwMjI0Njg4Ng@@._V1_SX300.jpg",
    "Metascore":"N/A",
    "imdbRating":"8.0",
    "imdbVotes":"79,101",
    "imdbID":"tt0364845",
    "Type":"series",
    "Response":"True"}
    */

    if (typeof jsonObject.Title === 'undefined' || jsonObject.Title === null) {
        alert("No valid Information found!");
        return;
    }

    var strippedJsonObject = {
        "Title": jsonObject.Title,
        "imdbID": jsonObject.imdbID,
        "Poster": jsonObject.Poster,
        "Season": 1,
        "Episode": 1,
        "favURL": ""
    };

    userSeriesList.push(strippedJsonObject);
    saveChanges();
    loadData();

}

function exportJSON() {
    document.getElementById('txt_IOData').value = JSON.stringify(userSeriesList);;

    var copyDiv = document.getElementById('txt_IOData');
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);

}

function importJSON() {
    var jsonString = document.getElementById('txt_IOData').value;
    userSeriesList = JSON.parse(jsonString);

    saveChanges();
    loadData();

    document.getElementById('txt_IOData').value = "";
}

function clearStorage() {
    chrome.storage.sync.clear();
    loadData();
}
