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
    loadStrings();
    loadSettings();
    setupEVH();
});

/*
    localization and event handlers
*/

function setupEVH() {
    if(!popup){
        //click imdb search
        document.getElementById('btn_getImdbData').addEventListener('click', getSeriesData);
        //document.getElementById('btn_clearStorage').addEventListener('click', clearStorage);
        document.getElementById('btn_refreshInfo').addEventListener('click', refreshInfo);

        //reactivate
        document.getElementById('btn_setActive').addEventListener('click', activateSeries);

        //import/export
        document.getElementById('btn_exportJSON').addEventListener('click', exportJSON);
        document.getElementById('btn_importJSON').addEventListener('click', importJSON);

        //settings
        document.getElementById('check_setting_incognito').addEventListener('change', settingsChanged);
        document.getElementById('check_setting_useIMDB').addEventListener('change', settingsChanged);
    }

}

function loadStrings() {
    if(!popup){
        //title
        document.getElementById('info_title').innerHTML = chrome.i18n.getMessage("manifest_name");

        //import/export
        document.getElementById('txt_IOData').setAttribute('placeholder',chrome.i18n.getMessage("info_importExport"));
        document.getElementById('btn_exportJSON').innerHTML = chrome.i18n.getMessage("string_export");
        document.getElementById('btn_importJSON').innerHTML = chrome.i18n.getMessage("string_import");

        //buttons
        document.getElementById('btn_getImdbData').innerHTML = chrome.i18n.getMessage("string_addIMDB");
        document.getElementById('btn_refreshInfo').innerHTML = chrome.i18n.getMessage("string_refreshInfo");
        document.getElementById('btn_setActive').innerHTML = chrome.i18n.getMessage("string_setActiv");

        //settigns
        document.getElementById('h_settings').innerHTML = chrome.i18n.getMessage("string_settings");
        document.getElementById('lbl_settings_icognito').innerHTML = chrome.i18n.getMessage("info_settings_incognito");
        document.getElementById('lbl_settings_useIMDB').innerHTML = chrome.i18n.getMessage("info_settings_useIMDB");
    }
}

/*
    get new episode dates
*/
function searchNew() {

    for (i = 0; i < userSeriesList.length; i++) {

        var searchUrl = "http://api.tvmaze.com/shows/" + userSeriesList[i].tvmazeID + "/episodebynumber?season=" + userSeriesList[i].Season + "&number=" + (userSeriesList[i].Episode + 1);


        var xhr = new XMLHttpRequest();
        xhr.open("GET", searchUrl, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var jsObj = JSON.parse(this.responseText);

                    var date = new Date(String(jsObj.airdate));
                    document.getElementById('lbl_newEpisode_' + this.data).innerHTML = chrome.i18n.getMessage("string_nextEpisode") + date.toLocaleDateString();

            }if(this.readyState == 4 && this.status == 404){
                searchRetry(this.data);
            }
        }
        xhr.data = i;
        xhr.send();

    }

}

function searchRetry(i){

    var nextSeason = parseInt(userSeriesList[i].Season) + 1;
    var searchRetryUrl = "http://api.tvmaze.com/shows/" + userSeriesList[i].tvmazeID + "/episodebynumber?season=" + nextSeason + "&number=" + 1;

    var xhrRetry = new XMLHttpRequest();
    xhrRetry.open("GET", searchRetryUrl, true);
    xhrRetry.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var jsObj = JSON.parse(this.responseText);

            var date = new Date(String(jsObj.airdate));
            document.getElementById('lbl_newEpisode_' + this.data).innerHTML = chrome.i18n.getMessage("string_nextSeason") + date.toLocaleDateString();

        }
    }
    xhrRetry.data = i;
    xhrRetry.send();
}

/*
    main loading function
*/
function loadData() {
    chrome.storage.sync.get("series_list", function(obj) {
        if (typeof obj.series_list === 'undefined' || obj.series_list === null) {
            userSeriesList = [];
        } else {
            userSeriesList = obj.series_list;
        }

        table = document.getElementById('tbl_series');
        if (popup) {
            table.innerHTML = "";
        } else {
            chrome.storage.sync.getBytesInUse(function(bytes) {
                document.getElementById('lbl_imdbJsonIds').innerHTML = "Bytes: " + bytes + " Count: " + userSeriesList.length;
            })


            var poster = chrome.i18n.getMessage("string_poster");
            var desc = chrome.i18n.getMessage("string_desc");
            var action = chrome.i18n.getMessage("string_action");
            var tracker = chrome.i18n.getMessage("string_tracker");
            var open = chrome.i18n.getMessage("string_open");
            table.innerHTML = "<thead><td>" + poster + "</td><td>" + desc + "</td><td>" + action + "</td><td>" + tracker + "</td><td>" + open + "</td></thead>";
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
            cell_info.innerHTML = "Title: " + userSeriesList[i].Title + "<br/><a target='_blank' href='http://www.imdb.com/title/" + userSeriesList[i].imdbID + "/'>IMDB</a> - <a target='_blank' href='http://www.tvmaze.com/shows/" + userSeriesList[i].tvmazeID + "'>TVmaze</a><br/> <label id='lbl_newEpisode_" + i + "'>" + chrome.i18n.getMessage("string_nothingNew") + "</label>";

            //delete/url button
            var cell_delete = document.createElement('td');
            cell_delete.innerHTML = "<button id='btn_delete_" + i + "' class='btn btn-danger'>" + chrome.i18n.getMessage("string_delete") + "</button> <button id='btn_setUrl_" + i + "' class='btn btn-success'>" + chrome.i18n.getMessage("string_setURL") + "</button>" + "</button> <button id='btn_setInaktiv_" + i + "' class='btn btn-warning'>" + chrome.i18n.getMessage("string_inaktiv"); + "</button>";

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

            //open Button
            var cell_favURL = document.createElement('td');
            cell_favURL.innerHTML = "<button id='btn_open_" + i + "' class='btn btn-info'>" + chrome.i18n.getMessage("string_open"); + "</button>";

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
                document.getElementById('btn_setInaktiv_' + i).addEventListener('click', tableSetInaktivClick);
            }

            document.getElementById('btn_season_add_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_season_sub_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_episode_add_' + i).addEventListener('click', tableTrackerClick);
            document.getElementById('btn_episode_sub_' + i).addEventListener('click', tableTrackerClick);

            document.getElementById('btn_open_' + i).addEventListener('click', openFavURL);

            document.getElementById('in_curEpisode_' + i).addEventListener('keyup', tableEpisodeChange);
            document.getElementById('in_curSeason_' + i).addEventListener('keyup', tableSeasonChange);
        }

        if (popup && userSeriesList.length < 1) {
            table.innerHTML = chrome.i18n.getMessage("info_empty") + " <button id='btn_empty_options' class='btn btn-info'>" + chrome.i18n.getMessage("string_settings") + "</button>";
            document.getElementById('btn_empty_options').addEventListener('click', openOptionsPage);
        }


        if(checkTvmazeID()){
            alert(chrome.i18n.getMessage("info_dataChanged"));
            setTimeout(function(){loadData}, 10000);
        }else{
            searchNew();
        }

    });


    chrome.storage.sync.get("inaktive_list", function(obj) {
        if (typeof obj.inaktive_list === 'undefined' || obj.inaktive_list === null) {
            userInaktivSeriesList = [];
        } else {
            userInaktivSeriesList = obj.inaktive_list;
        }

        if(!popup){
            drop_inactiveSeries.innerHTML = "";
            for(i = 0; i < userInaktivSeriesList.length; i++){
                drop_inactiveSeries.innerHTML += "<option value='"+ i +"'>" + userInaktivSeriesList[i].Title + "</option>";
            }
        }

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

function tableSetInaktivClick(e) {
    var btn_id = this.id;
    var i = btn_id.replace('btn_setInaktiv_', '');

    userInaktivSeriesList.push(userSeriesList[i]);

    userSeriesList.splice(i,1);

    saveChanges();
    loadData();

}

function activateSeries(){

    var i = document.getElementById('drop_inactiveSeries').value;

    userSeriesList.push(userInaktivSeriesList[i]);

    userInaktivSeriesList.splice(i,1);

    saveChanges();
    loadData();
}

/*
    functions for IMDB integration
*/

function imdbCallback(jsonString,instant) {
    var jsonObject = JSON.parse(jsonString);

    if (typeof jsonObject.Title === 'undefined' || jsonObject.Title === null) {
        alert("No valid Information found!");
        return;
    }

    for (i = 0; i<userSeriesList.length; i++){
        if(userSeriesList[i].imdbID == jsonObject.imdbID){
            userSeriesList[i].Title = jsonObject.Title;
            userSeriesList[i].Poster = jsonObject.Poster;

            getTvmazeInfo(userSeriesList[i].imdbID,instant);
        }
    }
}

function getSeriesData(e) {
    //parse userinput and create API Url tt0364845
    var imdbId = document.getElementById("in_seriesId").value;

    var strippedJsonObject = {
        "Title": "",
        "imdbID": imdbId,
        "Poster": "",
        "Season": 1,
        "Episode": 1,
        "tvmazeID": 0,
        "favURL": ""
    };

    userSeriesList.push(strippedJsonObject);

    if(userSettings.useIMDB){
        getImdbInfo(imdbId,true);
    }else{
        getTvmazeInfo(imdbId,true);
    }

}

/*
    function for tvmaze integration
*/

function getImdbInfo(imdbId, instant){
    var url = "http://www.omdbapi.com/?i=" + imdbId + "&plot=short&r=json";

    //initiate XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            imdbCallback(xhr.responseText,this.data);
        }
    }
    xhr.data = instant;
    xhr.send();
}

function getTvmazeInfo(imdbId, instant){

    var url = "http://api.tvmaze.com/lookup/shows?imdb=" + imdbId;

    //initiate XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            tvmazeCallback(xhr.responseText,this.data);
        }
    }
    xhr.data = instant;
    xhr.send();

}

function tvmazeCallback(jsonString,instant){
    var jsonObject = JSON.parse(jsonString);

    for (i = 0; i<userSeriesList.length; i++){
        if(userSeriesList[i].imdbID == jsonObject.externals.imdb){
            userSeriesList[i].tvmazeID = jsonObject.id;
            if(!userSettings.useIMDB){
                userSeriesList[i].Title = jsonObject.name;
                userSeriesList[i].Poster = jsonObject.image.medium;
            }
        }
    }

    saveChanges();

    if(instant){
        loadData();
    }
}


function checkTvmazeID(){
    missing = false;
    for (i = 0; i < userSeriesList.length; i++) {
        if(userSettings.useIMDB){
            getImdbInfo(userSeriesList[i].imdbID,false);
        }else{
            getTvmazeInfo(userSeriesList[i].imdbID,false);
        }
    }

    return missing;
}

/*
    functions for loading and saving
*/

function saveChanges() {

    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set({
        'series_list': userSeriesList,
        'inaktive_list' : userInaktivSeriesList
    }, function() {
        //not really do anything anytime you save
    });
}

function loadSettings() {
    chrome.storage.sync.get("user_settings", function(obj) {
        if (typeof obj.user_settings === 'undefined' || obj.user_settings === null) {
            userSettings = {
                "incognito": 0,
                "useIMDB": 0
            };
        } else {
            userSettings = obj.user_settings;

            if(!popup){
                document.getElementById('check_setting_incognito').checked = userSettings.incognito;
                document.getElementById('check_setting_useIMDB').checked = userSettings.useIMDB;
            }
        }
    });
}

function settingsChanged() {
    var setting_incognito = document.getElementById('check_setting_incognito').checked;
    var setting_useIMDB = document.getElementById('check_setting_useIMDB').checked;

    var newPoster = false;
    //get new poster id's
    if(userSettings.useIMDB != setting_useIMDB){
        newPoster = true;
    }

    userSettings.incognito = setting_incognito;
    userSettings.useIMDB = setting_useIMDB;

    chrome.storage.sync.set({
        'user_settings': userSettings,
    }, function() {
        //not really do anything anytime you save
    });

    if(newPoster){
        refreshInfo();
    }

}

function refreshInfo(){

    for (i = 0; i < userSeriesList.length; i++) {
        if(userSettings.useIMDB){
            getImdbInfo(userSeriesList[i].imdbID,false);
        }else{
            getTvmazeInfo(userSeriesList[i].imdbID,false);
        }
    }

    alert(chrome.i18n.getMessage("info_newData"));
    setTimeout(function(){loadData()}, 10000);
}

/*
    backup/import functions
*/
function exportJSON() {

    var jsonObj = {"active_series": "" , "inactive_series" : "" , "settings":""};
    jsonObj.active_series = userSeriesList;
    jsonObj.inactive_series = userInaktivSeriesList;
    jsonObj.settings = userSettings;

    var jsonString = JSON.stringify(jsonObj);
    document.getElementById('txt_IOData').value = jsonString;

    var copyDiv = document.getElementById('txt_IOData');
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);

}

function importJSON() {
    var jsonString = document.getElementById('txt_IOData').value;
    jsonObj = JSON.parse(jsonString);

     userSeriesList = jsonObj.active_series;
     userInaktivSeriesList = jsonObj.inactive_series;
     userSettings = jsonObj.settings;


    refreshInfo();

    document.getElementById('txt_IOData').value = "";
}

/*
    utility & debug functions
*/
function openOptionsPage() {

    chrome.tabs.create({
        'url': 'chrome-extension://' + chrome.runtime.id + "/options.html"
    });
}

function clearStorage() {
    chrome.storage.sync.clear();
    loadData();
}
