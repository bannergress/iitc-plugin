// ==UserScript==
// @id             bannergress-plugin
// @name           IITC Plugin: Bannergress
// @category       Misc
// @version        0.5.4
// @namespace      https://github.com/bannergress/iitc-plugin
// @updateURL      https://bannergress.com/iitc-plugin-bannergress.user.js
// @downloadURL    https://bannergress.com/iitc-plugin-bannergress.user.js
// @description    Bannergress integration for IITC
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') {
        window.plugin = function() {};
    }

    // PLUGIN START ////////////////////////////////////////////////////////

    if (window.plugin.bannerIndexer) {
        // bootPlugins is not ready yet, wait until loaded
        setTimeout(function() {
            let otherplugin = window.bootPlugins.info.filter(function(e) { if (e.script.name.match(/^IITC Plugin: Bannergress$/)) return e; });
            let otherpluginversion = '';
            if (otherplugin.length > 0) {
                otherpluginversion = '\nOther plugin version: IITC Plugin: Bannergress ' + otherplugin[0].script.version;
            }
            alert('IITC Plugin: Bannergress ' + plugin_info.script.version + "\n\nERROR: There are multiple copies of this plugin active!" + otherpluginversion + "\n\nTo fix the problem, you must remove or disable the oldest version!");
        },0);
        return;
    }

    const PLUGIN = window.plugin.bannerIndexer = function () { };

    PLUGIN.registerMissionsControl = function() {

        PLUGIN.MissionsControl = L.Control.extend({

            options: {
                position: 'topleft'
            },

            onAdd(map) {

                let el = $(`<div class="toggle-iitc-standard-layers-control leaflet-bar">
                                <a class="leaflet-bar-part miv-btn" ` + (isSmartphone() ? '' : 'title="Show missions in view"') + `>
                                    <div>🚩</div>
                                </a>
                                <a class="leaflet-bar-part zoom-btn" ` + (isSmartphone() ? '' : 'title="Zoom to all portals visible"') + `>
                                    <div>🔍</div>
                                </a>
                            </div>
                `);

                let mivBtn = el.find(".miv-btn").first();
                mivBtn.click(ev => {
                    window.plugin.missions.openTopMissions()
                })

                let zoomBtn = el.find(".zoom-btn").first();
                zoomBtn.click(ev => {
                    let zoom = map.getZoom();
                    if (zoom < 15) map.setZoom(15);
                })

                return el[0];
            }

        });

    }

    PLUGIN.missionsListHtml = `
        <div>
            <details style="width: 100%;  box-shadow: 0px 0px 10px rgba(0,0,0,0.75); box-sizing: border-box; padding: 0.5em; margin-bottom: 1em" class="bannerIndexer-filters" open>
                <summary>Bannergress utilities</summary>
                <div style="width: 100%; padding: 0.5em; box-sizing: border-box;">
                    <div class="bannerIndexer-filters-options">
                        Filters<br/>
                        <div style="display: flex; flext-direction: row">
                            <input display="flex: 1" class="bannerIndexer-name-filter" type="text" placeholder="filter by mission name" style="width: 100%">
                            <!--<button display="flex: 0; margin-left: 0.5em" class="bannerIndexer-apply-filters">Apply</button>-->
                        </div>
                        <div style="display: flex; flex-direction: row; padding-top: 0.5em; justify-content: space-between">
                            <div style="flex: 2">
                                <div style="padding-bottom: 0.5em">Show:</div>
                                <div style="display: flex; flex-direction: column">
                                    <div>
                                        <input type="checkbox" id="bannerIndexer-show-unindexed-filter" checked>
                                        <label for="bannerIndexer-show-unindexed-filter" title="show missions that have not been processed">new</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="bannerIndexer-show-refreshable-filter" checked>
                                        <label for="bannerIndexer-show-refreshable-filter" title="show missions that can be refreshed">refreshable</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="bannerIndexer-show-indexed-filter" checked>
                                        <label for="bannerIndexer-show-indexed-filter" title="show missions that have been processed and are up-to-date">up to date</label>
                                    </div>
                                </div>
                            </div>
                            <!--
                            <div style="flex: 2">
                                <div style="padding-bottom: 0.5em">Sort &amp; additional filters:</div>
                                    <input type="checkbox" id="bannerIndexer-sort-filter" checked class="bannerIndexer-sort-filter">
                                    <label for="bannerIndexer-sort-filter">sort results</label>
                                    <br>
                                    <input type="checkbox" id="bannerIndexer-hide-unnumbered-filter">
                                    <label for="bannerIndexer-hide-unnumbered-filter">only show numbered</label>
                                </div>
                            </div>
                            -->
                            <div style="flex: 0; justify-content: right">
                                <div class="bannerIndexer-functions">
                                    <table style="border-collapse: collapse; border: 0">
                                        <tr>
                                            <td colspan="3" style="text-align: center; padding-bottom: 0.5em">
                                                <button style="width: 100%" class="bannerIndexer-functions-fetch-all">⇓ Process all!</button><br>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><button class="bannerIndexer-move-north">▲N</button></td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td><button class="bannerIndexer-move-west">◀W</td>
                                            <td><button class="bannerIndexer-move-update">Upd</td>
                                            <td><button class="bannerIndexer-move-east">▶E</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><button class="bannerIndexer-move-south">▼S</td>
                                            <td></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
            <div id="bannerIndexer-filtered-count" style="display: none; text-align: center; padding: 0.25em"></div>
        </div>
    `;

    function encodeWaypoint(waypoint) {
        let data = [
            waypoint.hidden, // 0
            waypoint.guid, // 1
            waypoint.title, // 2
            waypoint.typeNum, // 3
            waypoint.objectiveNum, // 4
            null // portal // 5 - null if unavailable
        ]

        if (waypoint.typeNum == 1) {

            if (waypoint.portal) {
                let portalData = [
                    'p', // 0 - portal
                    'N', // 1 - team (neutral)
                    waypoint.portal.latE6, // 2 - lat
                    waypoint.portal.lngE6, // 3 - lng
                    1, // 4 - level
                    0, // 5 - ?
                    0, // 6 - ?
                    null, // 7 - image url
                    waypoint.title, // 8 - title
                    [], // 9 - ?
                    false, // 10 - ?
                    false, // 11 - ?
                    null, // 12 - ?
                    Date.now() // 13 - last changed timestamp
                ];
                data[5] = portalData;
            }

        } else if (waypoint.typeNum == 2) {

            if (waypoint.portal) {
                let fieldtripData = [
                    "f",
                    waypoint.portal.latE6,
                    waypoint.portal.lngE6
                ];
                data[5] = fieldtripData
            }

        }

        return data;

    }

    function encodeMission(mission) {
        let data = [
            mission.guid, // 0
            mission.title, // 1
            mission.description, // 2
            mission.authorNickname, // 3
            mission.authorTeam, // 4
            mission.ratingE6, // 5
            mission.medianCompletionTimeMs, // 6
            mission.numUniqueCompletedPlayers, // 7
            mission.typeNum, // 8
            mission.waypoints ? mission.waypoints.map(encodeWaypoint) : null, // 9
            mission.image // 10
        ]
        return data;
    }

    function getDialogButtons(dlg) {

        // get buttons
        let buttons = dlg.dialog('option', 'buttons');

        if (! (buttons instanceof Array)) {
            // transform to an array
            buttons = Object.keys(buttons).map(function(key) {
                return {
                    text: key,
                    click: buttons[key]
                }
            });
        }

        return buttons;
    }

    function setDialogButtons(dlg, buttons) {
        dlg.dialog('option', 'buttons', buttons);
    }

    function updateMissionCache(mission) {
        // update missions plugin cache also
        try {
            //console.debug("updating missions cache for " + mission.guid);
            let cloned = JSON.parse(JSON.stringify(mission));
            window.runHooks('plugin-missions-loaded-mission', { mission: cloned });
            window.plugin.missions.cacheByMissionGuid[mission.guid] = {
                data: cloned,
                time: Date.now()
            }
            window.plugin.missions.storeCache();
        } catch (err) {
            console.error("[bannergress] Error updating missions plugin cache:", err);
        }
    }

    function getMissionDetails(guid, callback, errorcallback) {

        // The window.plugin.missions.loadMission() method is broken in 2 ways
        //
        // 1. it does not return lat.lng data for fieldtrip waypoints
        //
        // 2. if the postAjax() call fails, it will not call the errorcallback
        //    handler because there is an unreferenced variable error that is
        //    thrown (no "error" variable)
        //
        // 3. (it caches data for quite long)

        window.postAjax('getMissionDetails', {
            guid: guid
        }, function(data) {
            console.debug("[bannergress] got intel data:", data);
            try {
                let mission = decodeMission(data.result);
                console.debug("[bannergress] decoded intel data:", mission);

                updateMissionCache(mission);

                if (!mission) errorcallback(new Error("Invalid data"));
                else callback(mission);
            } catch (err) {
                errorcallback(err);
            }
        }, function(err) {
            console.error("[bannergress] ERROR GETTING MISSION INFO FROM INTEL", err);
            errorcallback(err);
        });

    }

    function decodeWaypoint(data) {
        let result = {
            hidden: data[0],
            guid: data[1],
            title: data[2],
            typeNum: data[3],
            type: [null, 'Portal', 'Field Trip'][data[3]],
            objectiveNum: data[4],
            objective: [null, 'Hack this Portal', 'Capture or Upgrade Portal', 'Create Link from Portal', 'Create Field from Portal', 'Install a Mod on this Portal', 'Take a Photo', 'View this Field Trip Waypoint', 'Enter the Passphrase'][data[4]],
            portal: undefined
        };
        if (result.typeNum === 1 && data[5]) {
            if (window.decodeArray.portal) result.portal = window.decodeArray.portal(data[5], 'summary'); // IITC-CE 0.31.1 and after
            else result.portal = window.decodeArray.portalSummary(data[5]); // IITC-CE 0.31.1 and below
            // Portal waypoints have the same guid as the respective portal.
            result.portal.guid = result.guid;
        } else if (result.typeNum == 2 && data[5]) { // field trip!
            result.portal = {
                // data[5] = [ "f", <latE6>, <lngE6> ]
                latE6: data[5][1],
                lngE6: data[5][2],
                title: result.title
            }
        }
        return result;
    }

    function decodeMission(data) {
        return {
            guid: data[0],
            title: data[1],
            description: data[2],
            authorNickname: data[3],
            authorTeam: data[4],
            ratingE6: data[5],
            medianCompletionTimeMs: data[6],
            numUniqueCompletedPlayers: data[7],
            typeNum: data[8],
            type: [null, 'Sequential', 'Non Sequential', 'Hidden'][data[8]],
            waypoints: data[9].map(decodeWaypoint),
            image: data[10]
        };
    }

    class ProgressDialog {

        constructor(plugin, stopCallback) {
            this.plugin = plugin;
            this.stopCallback = stopCallback;
            this.dialog = null;
        }

        show(callback) {
            let focused = false;
            this.dialog = dialog({
                title: 'Bannergress plugin - batch processing',
                html:   `<div class="bannerIndexer-batch" style="padding: 1em">
                            <div class="bannerIndexer-batch-status"></div>
                            <div>
                                <progress class="bannerIndexer-batch-progress" style="width: 100%" max="100" value="0"></progress>
                            </div>
                            <div class="bannerIndexer-batch-title"></div>
                        </div>`,
                modal: true,
                width: 400,
                buttons: [
                    {
                        text: "Stop!",
                        click: () => {
                            console.log("[bannergress] stopping batch processing..");
                            this.stopCallback();
                        }
                    }
                ],

                focusCallback: () => {
                    if (focused) return;
                    focused = true;
                    setTimeout(() => {
                        this.progressEl = this.dialog.find(".bannerIndexer-batch-progress").first();
                        this.statusEl = this.dialog.find(".bannerIndexer-batch-status").first();
                        this.titleEl = this.dialog.find(".bannerIndexer-batch-title").first();
                        if (callback) callback(this);
                    }, 0);
                }

            });
        }

        setStatus(text) {
            this.statusEl.text(text);
        }

        setProgress(cur, max) {
            this.progressEl.attr('max', max);
            this.progressEl.val(cur);
        }

        setExtra(text) {
            this.titleEl.text(text);
        }

        close() {
            this.dialog.dialog('close');
        }

        isOpen() {
            return this.dialog.dialog("isOpen");
        }



    }

    class DialogContext {

        constructor(plugin, type) {
            this.plugin = plugin;
            this.type = type;
            this.id = Math.round(0xFFFFFFFF * Math.random()) + '_' + Date.now();
            this.missions = [];
            this.origin = null;
            this.dialog = null;
            this.stopBatch = false;
        }

        updateElems() {
            this.missions.forEach(mission => {
                this.updateElem(mission);
            })
        }

        updateElem(mission, suppressBroadcast) {

            const MISSIONS_PLUGIN = window.plugin.missions;

            let status = this.getStatus(mission);
            //console.error("updateElem()", status.id, mission.guid, mission.title);

            if (!mission.$ours) {

                mission.$ours = this.makeElem(status);

                //--- add after <a>
                let a = $(mission.$elem).find("a");
                mission.$ours.insertAfter(a);

            } else {

                // replace
                let newOurs = this.makeElem(status);
                mission.$ours.replaceWith(newOurs);
                mission.$ours = newOurs;

            }

            if (!status.locked) {
                mission.$ours.click(() => {
                    //console.log("DOWNLOAD", mission);
                    this.plugin.downloadMission(mission, (err, updatedMission) => {
                        if (!err) {
                            //console.log("DOWNLOAD OK!", updatedMission);

                            // re-apply filters if this is a list (remove etc)
                            // if (this.type == "list") {
                            //     if (this.applyFilters) this.applyFilters();
                            // }
                            // ^TODO: FIXME: this scrolls the list to the top again...

                        } else {
                            alert("ERROR!\n\nAn error occurred while processing mission details:\n\n" + err.message);
                            console.log("[bannergress] ERROR DOWNLOADING MISSION:", err);
                        }
                    });
                });
            }

            if (suppressBroadcast !== true) {
                this.plugin.broadcastUpdateElem(mission, this);
            }
        }

        makeElem(status) {
            //let ours = $('<span title="' + status.title + '" class="bannerIndexer-mission-status bannerIndexer-mission-status-' + status.id + '">' + status.icon + '</span>');
            let icon = this.plugin.icons[status.id];
            let iconHtml = icon.svg ? icon.svg.replace(/^<svg/, '<svg class="bannerIndexer-icon-svg"') : icon.unicode;
            let ours = $('<span title="' + status.title + '" class="bannerIndexer-mission-status bannerIndexer-mission-status-' + status.id + '">' + iconHtml + '</span>');
            return ours;
        }

        isIndexed(known) {
            return (known.waypoints || known.$detailsUpdated);
        }

        getStatus(m) {
            if (m && m.$pending) {
                return { id: 'pending', icon: '⏳', text: 'Updating', title: 'Updating...', locked: true };
            } else if (m.$known && this.isIndexed(m.$known)) {
                // known and indexed - check if it was done recently
                let lockTime = this.plugin.settings.refreshLockTime;
                let lockedUntil = m.$known.$detailsUpdated + lockTime;
                let now = Date.now();
                let deltaTime = lockedUntil - now;
                let time = new Date(m.$known.$detailsUpdated).toLocaleDateString();
                if (m.$known.$detailsUpdated && deltaTime > 0) {

                    //console.log("MODIFIED", m.$known.$detailsUpdated, lockTime, deltaTime, time);
                    let DAYMILLIS = 24 * 60 * 60 * 1000;
                    let HOURMILLIS = 60 * 60 * 1000;
                    let MINUTEMILLIS = 60 * 1000;
                    let days = Math.floor(deltaTime / DAYMILLIS);
                    let hours = Math.floor((deltaTime % DAYMILLIS) / HOURMILLIS);
                    let mins = Math.ceil((deltaTime % HOURMILLIS) / MINUTEMILLIS);

                    let lockedTime = days+"d " + hours+"h " + mins+"m";
                    return { id: 'indexed', icon: '🔒', text: 'Indexed', locked: true, title: 'Last updated: ' + time + ' - You can update again in ' + lockedTime}

                } else {

                    return { id: 'indexed-refresh', icon: '✅', text: 'Indexed', title: 'Last updated: ' + time + ' - click to refresh!' }

                }
            } else if (m.$known) {

                // known, but no details
                return { id: 'new', icon: '🔃', text: 'Not indexed', title: 'Click to add!' }

            } else {

                // not known
                return { id: 'new', icon: '🔃', text: 'Not indexed', title: 'Click to add!' }

            }
        }

        injectUI() {

            const move = (latDelta, lngDelta) => {
                /*
                let c = map.getCenter();
                let b = map.getBounds();
                //console.log(c, b);
                let dy = b.getNorth() - b.getSouth();
                let dx = b.getEast() - b.getWest();
                let lat = c.lat + latDelta*dy;
                let lng = c.lng + lngDelta*dx;
                map.panTo([ lat, lng ], { animate: false });
                */
                let bounds = map.getPixelBounds();
                let width =  Math.abs(bounds.max.x - bounds.min.x);
                let height = Math.abs(bounds.max.y - bounds.min.y);
                let offset = new L.Point(lngDelta * width, -latDelta * height);
                map.panBy(offset, { animate: false });

                if (this.plugin.settings.moveAutoRefresh) {
                    setTimeout(() => {
                        this.dialog.dialog('close');
                        MISSIONS_PLUGIN.openTopMissions();
                    }, 250);
                }

            }

            function zpad(text, minLength) {
                while (text.length < minLength) text = "0" + text;
                return text;
            }

            function normalizeTitle(mission) {
                return mission.title.toLowerCase().replace(/\b(\d+)\b/g, function(x) { return zpad(x, 5) });
            }

            const MISSIONS_PLUGIN = window.plugin.missions;

            // install the toolbox
            let dlg = this.dialog;
            let div = dlg.find('> div');

            // set up so that toolbox starts on top and missions list is scrolalble beneath
            div.parent().css('display', 'flex');
            div.parent().css('flex-direction', 'column');
            div[0].style.overflowY = 'auto';

            // inject toolbox above <div> that contains missions list

            let elems = $(this.plugin.missionsListHtml);
            elems.insertBefore(div);
console.log('DEBUG insert missionsListHtml');

            // inject settings button
            let buttons = getDialogButtons(dlg);
            buttons.unshift({
                text: 'Bannergress settings',
                click: () => {
                    dlg.dialog('close');
                    let d = new SettingsDialog(this.plugin);
                    d.show();
                }
            })
            setDialogButtons(dlg, buttons);

            let nameFilterInput = elems.find(".bannerIndexer-name-filter");

            let previousFilters = {};
            try {
                previousFilters = JSON.parse(localStorage.getItem("bannerIndexer.filters"));
                if (previousFilters == null || typeof previousFilters != "object") previousFilters = {};
            } catch (err) {
            }

            nameFilterInput.val(previousFilters.nameFilter || "");
            $('#bannerIndexer-show-unindexed-filter').prop("checked", previousFilters.includeUnindexed);
            $('#bannerIndexer-show-refreshable-filter').prop("checked", previousFilters.includeRefreshable);
            $('#bannerIndexer-show-indexed-filter').prop("checked", previousFilters.includeLocked);
            //$('#bannerIndexer-hide-unnumbered-filter').prop("checked", previousFilters.excludeUnnumbered);
            //$('#bannerIndexer-sort-filter:checked').prop("checked", previousFilters.sortAlpha);

            elems.find(".bannerIndexer-move-north").click(() => move(1, 0));
            elems.find(".bannerIndexer-move-south").click(() => move(-1, 0));
            elems.find(".bannerIndexer-move-west").click(() => move(0, -1));
            elems.find(".bannerIndexer-move-east").click(() => move(0, 1));
            elems.find(".bannerIndexer-move-update").click(() => {
                this.dialog.dialog('close');
                MISSIONS_PLUGIN.openTopMissions();
            });

            const getFilteredMissions = (forceOnlyDownloadable) => {

                let nameFilter = nameFilterInput.val().toString().toLowerCase();
                let includeUnindexed = $('#bannerIndexer-show-unindexed-filter:checked').length > 0;
                let includeRefreshable = $('#bannerIndexer-show-refreshable-filter:checked').length > 0;
                let includeLocked = $('#bannerIndexer-show-indexed-filter:checked').length > 0;
                let excludeUnnumbered = false; // $('#bannerIndexer-hide-unnumbered-filter:checked').length > 0;
                let sortAlpha = true; // $('#bannerIndexer-sort-filter:checked').length > 0;

                localStorage.setItem("bannerIndexer.filters", JSON.stringify({
                    nameFilter,
                    includeUnindexed,
                    includeRefreshable,
                    includeLocked,
                    excludeUnnumbered,
                    sortAlpha
                }));

                // console.log("applying filters", {
                //     nameFilter,
                //     includeUnindexed,
                //     includeRefreshable,
                //     includeLocked,
                //     excludeUnnumbered,
                //     sortAlpha
                // });

                let filteredMissions = this.missions.filter((mission) => {
                    let status = this.getStatus(mission);
                    let include = mission &&
                        mission.title.toLowerCase().indexOf(nameFilter) >= 0 &&
                        (
                            status.id == 'pending' ||
                            (includeUnindexed && status.id == 'new') ||
                            (includeRefreshable && status.id == 'indexed-refresh') ||
                            (includeLocked && status.id == 'indexed' && forceOnlyDownloadable !== true)
                        ) && (!excludeUnnumbered || /\d+/.test(mission.title));


                    //console.log("filter: m: %o s: %o => %s", mission, status, include);
                    return include;
                })

                if (sortAlpha) {

                    filteredMissions.sort((a,b) => {
                        let at = normalizeTitle(a);
                        let bt = normalizeTitle(b);
                        return at.localeCompare(bt)
                    })

                }

                //console.log("FILTERED ->");
                //console.dir(filteredMissions);

                return filteredMissions;
            }

            const applyFilters = this.applyFilters = () => {

                let filteredMissions = getFilteredMissions();
                let numHidden =  this.missions.length - filteredMissions.length;
                if (filteredMissions.length == 0 && this.missions.length > 0)
                    $("#bannerIndexer-filtered-count").text(`Your current filters exclude all missions! (${numHidden} hidden)`).show();
                else {
                    $("#bannerIndexer-filtered-count").text(`Showing ${filteredMissions.length} of ${this.missions.length} missions (${numHidden} hidden by filters)`).show();
                }

                //console.log("applyFilters -> ", filteredMissions);

                let newDiv = $(MISSIONS_PLUGIN.renderMissionList(filteredMissions));
                newDiv.css('overflow-y', 'auto');
                $(div).replaceWith(newDiv);
                div = newDiv;

                this.updateElems();
            }

            [
                '#bannerIndexer-show-unindexed-filter',
                '#bannerIndexer-show-refreshable-filter',
                '#bannerIndexer-show-indexed-filter',
                '#bannerIndexer-hide-unnumbered-filter',
                '#bannerIndexer-sort-filter'
            ].forEach(cbx => {
                $(cbx).click(() => applyFilters());
            })

            nameFilterInput.on('input', ev => {
                applyFilters();
            })

            applyFilters();

            // nameFilterInput.keydown(function(ev) {
            //     if (ev.key == "Enter" || ev.keyCode == 13) {
            //         applyFilters();
            //     }
            // })

            this.stopBatch = false;

            elems.find(".bannerIndexer-functions-fetch-all").first().click(ev => {
                this.stopBatch = false;
                let filteredMissions = getFilteredMissions(true); // only get the ones we're supposed to be downloading (exclude locked ones)

                // apply hard limit
                if (filteredMissions.length > this.plugin.settings.batchMaxHard) {
                    filteredMissions = filteredMissions.slice(0, this.plugin.settings.batchMaxHard);
                }

                if (filteredMissions.length == 0) {
                    alert("There are no missions to process - please adjust your filters or move to an area with some missions!");
                    return;
                }

                let confirmAmount = (filteredMissions.length > this.plugin.settings.batchMaxUser);

                if (filteredMissions.length > 0) {
                    if (confirmAmount) {
                        if (!confirm(`This will process ${filteredMissions.length} mission${filteredMissions.length != 1 ? 's' : ''} - are you sure you want to continue?`))
                            return;
                    }

                    let funs = elems.find(".bannerIndexer-functions");

                    let progressDlg = new ProgressDialog(this, () => this.stopBatch = true);

                    progressDlg.show(() => {
                        dlg.parent().hide(); // hide window while working

                        let num = 0;
                        let count = filteredMissions.length;

                        let okCount = 0;
                        let errCount = 0;
                        let failed = [];

                        const downloadNext = () => {
                            //console.log("batch: NEXT!");

                            progressDlg.setStatus("");
                            let cur = filteredMissions.shift();
                            console.log("[bannergress] batch: process next:", cur);
                            if (cur && !this.stopBatch) {

                                progressDlg.setStatus(`Processing ${num+1} of ${count}..`);
                                progressDlg.setExtra(cur.title);
                                progressDlg.setProgress(num, count);
                                num++;

                                let batchWaitBase = this.plugin.settings.batchMinimumDelay;
                                let batchWaitRandom = this.plugin.settings.batchRandomizeExtraDelay;

                                console.log("[bannergress] batch: downloading mission", { cur });
                                this.plugin.downloadMission(cur, (err, mission) => {

                                    console.log("[bannergress] batch: download mission completed:", { cur, err, mission });

                                    if (err) {
                                        if (err.isCritical) {
                                            alert("ERROR!\n\nAn error occurred while submitting the mission details - please log in again!")
                                            this.stopBatch = true;
                                        }
                                        errCount++;
                                        failed.push(cur);
                                    } else {
                                        okCount++;
                                    }

                                    let wait = filteredMissions.length > 0 && !this.stopBatch
                                        ? Math.round(batchWaitBase + Math.random() * batchWaitRandom)
                                        : 0;

                                    setTimeout(() => downloadNext(), wait); // random waiting
                                });

                            } else {

                                if (progressDlg.isOpen()) {
                                    dlg.parent().show();
                                    progressDlg.close();
                                    applyFilters();
                                }
                            }
                        }

                        downloadNext();

                    })
                }

            });

        }

    }

    class SettingsDialog {

        constructor(plugin) {
            this.plugin = plugin;
            this.dlg = null;
        }

        show() {

            const plugin = this.plugin;
            const settings = plugin.settings;

            let mapControlEnabledCbx,
                batchMaxUserInput,
                providerAreaDiv,
                providerSelect,
                moveAutoRefreshCbx,
                batchMaxHardInput, batchMinimumDelayInput, batchRandomizeExtraDelayInput, refreshLockTimeInput

            let buttons = [
                {
                    text: 'Close',
                    click: () => {
                        this.dlg.dialog("close");
                        // if (confirm("Close without saving?"))
                        //     this.dlg.dialog("close");
                    }
                },
                {
                    text: 'Save',
                    click: () => {

                        let settings = plugin.settings;

                        // tweaks
                        settings.batchMaxHard = parseInt(batchMaxHardInput.val());
                        settings.batchMinimumDelay = parseInt(batchMinimumDelayInput.val());
                        settings.batchRandomizeExtraDelay = parseInt(batchRandomizeExtraDelayInput.val());
                        settings.refreshLockTime = parseInt(refreshLockTimeInput.val());

                        // general
                        settings.mapControlEnabled = mapControlEnabledCbx.is(":checked");
                        settings.moveAutoRefresh = moveAutoRefreshCbx.is(":checked");
                        settings.batchMaxUser = Math.min(settings.batchMaxHard, parseInt(batchMaxUserInput.val()));
                        settings.provider = providerSelect.val();

                        // provider
                        plugin.provider = plugin.integrations[plugin.settings.provider];

                        // save!
                        plugin.provider.saveSettings(providerAreaDiv, this.dlg);
                        plugin.saveSettings();

                        // bye
                        this.dlg.dialog("close");
                    }
                }
            ];

            if (plugin.provider.beforeShowSettings) {
                plugin.provider.beforeShowSettings({ buttons: buttons });
            }

            let focused = false;

            this.dlg = dialog({

                id: "bannerIndexer-settings-dialog",

                title: "Bannergress settings",

                html: `<div class="bannerIndexer-settings-dialog">
                    <fieldset>
                        <legend>General</legend>
                        <table>
                            <tr>
                                <td>Prompt if more than this number of missions to batch process</td>
                                <td><input class="bannerIndexer-settings-dialog-batchMaxUser" style="width: 100%" type="number" min="1"></td>
                            </tr>
                            <tr>
                                <td>Automatically refresh missions list on N/E/S/W buttons</td>
                                <td><input type="checkbox" class="bannerIndexer-settings-dialog-moveAutoRefresh" /></td>
                            </tr>
                            <tr>
                                <td>Enable map controls</td>
                                <td><input type="checkbox" class="bannerIndexer-settings-dialog-mapControlEnabled" /></td>
                            </tr>
                            <tr class="bannerIndexer-settings-dialog-provider-row" style="display: none">
                                <td>Integration</td>
                                <td>
                                    <select style="width: 100%" class="bannerIndexer-settings-dialog-provider"></select>
                                </td>
                            </tr>
                        </table>
                    </fieldset>
                    <fieldset class="tweaks" style="margin-top: 1em">
                        <legend>Tweaks</legend>
                        <table>
                            <tr>
                                <td>Hard max number of missions to batch process:</td>
                                <td><input class="bannerIndexer-settings-dialog-batchMaxHard" style="width: 100%" type="number" min="1"></td>
                            </tr>
                            <tr>
                                <td>Batch minimum delay: [ms]</td>
                                <td><input class="bannerIndexer-settings-dialog-batchMinimumDelay" style="width: 100%" type="number" min="0" step="100"></td>
                            </tr>
                            <tr>
                                <td>Batch randomized extra delay: [ms]</td>
                                <td><input class="bannerIndexer-settings-dialog-batchRandomizeExtraDelay" style="width: 100%" type="number" min="0" step="100"></td>
                            </tr>
                            <tr>
                                <td>Refresh lock time: [ms]</td>
                                <td><input class="bannerIndexer-settings-dialog-refreshLockTime" style="width: 100%" type="number" min="0" step="1000"></td>
                            </tr>
                        </table>
                    </fieldset>
                    <fieldset style="margin-top: 1em">
                        <legend>Integration</legend>
                        <div class="bannerIndexer-settings-dialog-provider-area"></div>
                    </fieldset>
                </div>`,

                width: 400,

                modal: true,

                focusCallback: (el, ui) => {
                    setTimeout(() => {
                        if (focused) return;
                        focused = true;

                        // find our controls
                        providerSelect = $(".bannerIndexer-settings-dialog-provider").first();
                        providerAreaDiv = $(".bannerIndexer-settings-dialog-provider-area").first();
                        mapControlEnabledCbx = $(".bannerIndexer-settings-dialog-mapControlEnabled").first();
                        batchMaxUserInput = $(".bannerIndexer-settings-dialog-batchMaxUser").first();

                        moveAutoRefreshCbx = $(".bannerIndexer-settings-dialog-moveAutoRefresh").first();
                        batchMaxHardInput = $(".bannerIndexer-settings-dialog-batchMaxHard").first();
                        batchMinimumDelayInput = $(".bannerIndexer-settings-dialog-batchMinimumDelay").first();
                        batchRandomizeExtraDelayInput = $(".bannerIndexer-settings-dialog-batchRandomizeExtraDelay").first();
                        refreshLockTimeInput = $(".bannerIndexer-settings-dialog-refreshLockTime").first();

                        if (settings.mapControlEnabled) mapControlEnabledCbx.attr("checked", "checked");
                        if (settings.moveAutoRefresh) moveAutoRefreshCbx.attr("checked", "checked");

                        batchMaxUserInput.attr("max", settings.batchMaxHard);
                        batchMaxUserInput.val(settings.batchMaxUser);

                        batchMaxHardInput.val(settings.batchMaxHard);
                        batchMinimumDelayInput.val(settings.batchMinimumDelay);
                        batchRandomizeExtraDelayInput.val(settings.batchRandomizeExtraDelay);
                        refreshLockTimeInput.val(settings.refreshLockTime);

                        if (localStorage.getItem("BANNERINDEXER_TWEAKS") != null) {
                            $(".bannerIndexer-settings-dialog .tweaks").show();
                        }

                        this.dlg.dialog("option", "position", {my: "center", at: "center", of: window});

                        //console.log("select", select);
                        for (let key in plugin.integrations) {
                            //console.log("== " + key);
                            let integration = plugin.integrations[key];
                            let option = $("<option>", {
                                value: key,
                                text: integration.name,
                                selected: key == plugin.provider.id,
                            })
                            //console.log("option", option);
                            providerSelect.append(option);
                        }
                        providerSelect.change((ev) => {
                            //console.log("integration changed", ev);
                            let temp = plugin.integrations[ev.target.value];
                            providerAreaDiv.empty();
                            temp.showSettings(providerAreaDiv, this.dlg);
                        })

                        providerAreaDiv.empty();
                        plugin.provider.showSettings(providerAreaDiv, this.dlg);

                    }, 0);

                },

                closeCallback: () => {
                    // TODO
                },

                buttons: buttons
            });

            return this.dlg;
        }

        close() {
            this.dlg.dialog('close');
        }

    }

    class PleaseWaitDialog {

        constructor(plugin, cancelCallback) {
            this.plugin = plugin;
            this.cancelCallback = cancelCallback;
            this.dlg = null;
            this.cancelled = false;
        }

        show(text) {
            this.dlg = dialog({
                html: text,
                title: 'Bannergress plugin',
                modal: true,
                id: "bannerIndexer-pleasewait-dialog",
                buttons: [
                    {
                        text: "Cancel",
                        click: () => {
                            this.cancelled = true;
                            this.dlg.cancelled = true;
                            this.dlg.dialog("close");
                            if (this.cancelCallback) {
                                this.cancelCallback();
                            }
                        }
                    }
                ]
            })
            return this.dlg;
        }

        close() {
            this.dlg.dialog('close');
        }

    }

    class BannergressIntegration {

        constructor(plugin) {
            this.plugin = plugin;

            this.id =  'bannergress';

            this.name = "Bannergress";

            this.requireLogin = true;

            this.config = {
                keycloak: {
                    "realm": "bannergress",
                    "url": "https://login.bannergress.com/auth/",
                    "clientId": "bannergress-iitc-plugin"
                },
                baseUrl: "https://api.bannergress.com/"
            };

            this.settings = {
                subject: null,
                token: null,
                refreshToken: null
            }

            this.isAuthenticated = false;
        }

        initialize(callback) {
            this.checkAuth((err, res) => {
                callback(err, res);
            });
        }

        checkAuth(callback) {

            const plugin = this.plugin;

            this.isAuthenticated = false;

            if (this.keycloakPromise == null) {
                console.log("[bannergress] creating interface..");
                this.keycloakPromise = $.getScript("https://login.bannergress.com/auth/js/keycloak.js")
                .then(() => (this.keycloak = new Keycloak(this.config.keycloak)))
                .then(() => this.keycloak.init({
                    token: this.settings.token,
                    refreshToken: this.settings.refreshToken,
                    enableLogging: true,
                    checkLoginIframe: false
                }));
            }

            console.log("[bannergress] initializing..");
            try {
                this.keycloakPromise.then((authenticated) => {
                    this.settings.subject = this.keycloak.subject;
                    this.settings.refreshToken = this.keycloak.refreshToken;
                    this.settings.token = this.keycloak.token;
                    plugin.saveProviderSettings(this);
                    this.isAuthenticated = authenticated;
                    callback(null, authenticated);
                }).catch(err => {
                    console.log("[bannergress] error initializing keycloak", err);
                    callback(err);
                });
            } catch (err) {
                console.error("[bannergress] keycloak initialization error:", err);
                callback(err);
            }

        }

        login(callback) {
            if (!this.isAuthenticated) {
                this.keycloak.login({ scope: 'offline_access' })
                .then(() => callback(null))
                .catch(err => callback(err));
            }
        }

        preflight(callback) {
            const plugin = this.plugin;

            console.log("[bannergress] performing preflight..");
            this.keycloak.updateToken(30).then((refreshed) => {
                console.log("[bannergress] token was " + (refreshed ? "refreshed" : "still valid"),  { token: this.settings.token, refreshToken: this.settings.refreshToken });
                if (refreshed) {
                    this.settings.token = this.keycloak.token;
                    this.settings.refreshToken = this.keycloak.refreshToken;
                    plugin.saveProviderSettings(this);
                }
                callback(null);
            }).catch(err => {
                console.error("[bannergress] error refreshing token, you have to log in again!", err);
                callback(new Error("Error refreshing access token, you will have to log in again via the options dialog!"));
                // this.checkAuth((err, res) => {
                //     if (err) {
                //         console.error("[bannergress] error refreshing token, you have to log in again!", err);
                //         callback(new Error("Error refreshing access token, you have to log in again!"));
                //     }
                //     else callback(null);
                // });
            })
        }

        checkMissions(missions, callback) {

            let missionIds = missions instanceof Array
                    ? missions.map(function(m) { return m.guid })
                    : [ missions.guid ];
            console.log("[bannergress] checking missions",  { missions, missionIds });

            this.preflight(err => {
                if (err) return callback(err);
                console.log("[bannergress] checking which missions have been indexed..");
                console.log("[bannergress] " + `${this.config.baseUrl}missions/status ` + JSON.stringify(missionIds));
                $.ajax({
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        authorization: `Bearer ${this.settings.token}`
                    },
                    url: `${this.config.baseUrl}missions/status`,
                    data: JSON.stringify(missionIds)
                }).done(res => {
                    console.log("[bannergress] check missions returned:", res);
                    let knownList = this.parseResponse(res);
                    console.debug("[bannergress] parsed response: %o -> %o", res, knownList);
                    callback(null, knownList);

                }).fail(xhr => {
                    console.error("[bannergress] Error checking mission statuses, XHR=", xhr);
                    let err = new Error(`Error checking mission statuses (XHR: ${xhr.responseText})`)
                    callback(err);
                })
            });
        }

        submitMission(mission, callback) {

            console.log("[bannergress] converting mission plugin data to mission data", { mission });
            let missionData = encodeMission(mission);
            console.log("[bannergress] converted mission data", { missionData, mission });
            this.preflight(err => {
                if (err) return callback(err);
                console.log("[bannergress] importing mission data..");
                $.ajax({
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        authorization: `Bearer ${this.settings.token}`
                    },
                    url: `${this.config.baseUrl}import/details`,
                    data: JSON.stringify(missionData)
                }).done(res => {
                    console.log("[bannergress] import mission returned:", res);

                    if (res.latestUpdateDetails) { // actual api deviates from doc
                        res = { [mission.guid]: res }
                    }

                    let knownList = this.parseResponse(res);
                    callback(null, knownList.find(x => x.guid == mission.guid));
                }).fail(xhr => {
                    console.error("[bannergress] import mission failed:", xhr);
                    let err = new Error("Failed to submit mission details to server (XHR: " + xhr.statusText + ")");
                    callback(err);
                })
            });

        }

        parseResponse(res) {
            let knownList = [];
            for (let guid in res) {
                let mission = res[guid];
                if (mission.latestUpdateSummary != null || mission.latestUpdateDetails != null) {
                    knownList.push({
                        guid: guid,
                        $summaryUpdated: Date.parse(mission.latestUpdateSummary),
                        $detailsUpdated: Date.parse(mission.latestUpdateDetails)
                    });
                }
            }
            console.debug("[bannergress] parsed response: %o -> %o", res, knownList);
            return knownList;
        }

        showSettings(el) {
            const plugin = this.plugin;

            let checking = $("<span>Checking login status..</span>");
            el.append(checking);
            this.initialize((err) => {
                console.log("[bannergress] checking authentication status..");

                const onLoggedIn = () => {
                    console.log("[bannergress] authenticated");
                    el.append("<span>Authenticated!</span><br>");
                    el.append($("<button>", {
                        text: "Log out",
                        click: () => {
                            this.settings.subject = null;
                            this.settings.token = null;
                            this.settings.refreshToken = null;
                            plugin.saveSettings();
                            this.keycloak.logout(window.location.href);
                        }
                    }))
                }

                const onLoggedOut = () => {
                    console.log("[bannergress] not authenticated, need login");
                    el.append('<div style="padding: 0.5em; color: #EE3333; font-size: 1.2em; font-weight: bold">To use the Bannergress plugin you must log in first - please do so now!</div>')
                    el.append(
                        $("<button>", {
                            text: "Log in",
                            click: () => {
                                // this will redirect via an external site, so
                                // we need to set this as the provider and save
                                // settings
                                plugin.provider = this;
                                plugin.saveSettings();
                                console.log("[bannergress] login");
                                if (this.isAuthenticated) this.keycloak.logout();
                                this.login();
                            }
                        })
                    )
                }

                this.checkAuth((err, res) => {
                    console.log({ err, res });
                    if (err) {
                        checking.remove();
                        console.error("[bannergress] error checking authentication", err)
                        el.append("Error checking authentication: " + err);
                        onLoggedOut();
                    } else {
                        if (res) {
                            // keycloak *MAY* say the token is ok here even if it is invalidated......
                            this.preflight(err => {
                                checking.remove();
                                if (err) onLoggedOut();
                                else onLoggedIn();
                            });
                        } else {
                            checking.remove();
                            onLoggedOut();
                        }
                    }
                })
            })

        }

        saveSettings(el) {

        }

    }

    PLUGIN.contexts = {};
    PLUGIN.contextStack = [];

    PLUGIN.integrations = {
        bannergress: new BannergressIntegration(PLUGIN)
    };

    PLUGIN.setupCSS = function() {

        $('head').append(`<style type="text/css">

        .bannerIndexer-icon-svg {
            width: 1.45em;
            height: 1.45em;
        }

        .bannerIndexer-settings-dialog table tr td {
            padding-bottom: 0.5em;
        }

        .bannerIndexer-settings-dialog .tweaks {
            display: none;
        }

        .bannerIndexer-settings-dialog table tr td:first-child {
            width: 50%
        }

        .bannerIndexer-util-disable {
            filter: blur(2px);
            pointer-events: none;
        }

        details.bannerIndexer-filters summary::before {
            content:"⊞ ";
        }

        details.bannerIndexer-filters[open] summary::before {
            content:"⊟ ";
        }

        .bannerIndexer-mission-row {
        }

        .bannerIndexer-mission-extend-title {
            flex: 1;
            display: inline-block;
        }

        .bannerIndexer-mission-row-indexed {
            // background-color: rgba(0,255,0,0.2);
        }
        .bannerIndexer-mission-row-new {
            // background-color: rgba(255,255,0,0.2);
        }
        .bannerIndexer-mission-row-pending {
            // background-color: rgba(255,128,0,0.2);
        }
        .bannerIndexer-mission-row-index-locked {
            // background-color: rgba(0,255,0,0.1);
        }

        .bannerIndexer-mission-status {
            position: absolute;
            right: 0.5em;
            top: 0.25em;
            padding: 0.25em;
            color: white;
            flex: 0;
        }

        .bannerIndexer-mission-status-indexed {
            color: green;
            cursor: not-allowed;
        }

        .bannerIndexer-mission-status-indexed-refresh {
            color: greenyellow;
            cursor: pointer;
        }

        .bannerIndexer-mission-status-pending {
            color: orange;
            cursor: wait;
        }

        .bannerIndexer-mission-status-new {
            color: gold;
            cursor: pointer;
        }

        </style>`);

    }.bind(PLUGIN);

    PLUGIN.broadcastUpdateElem = function(mission, sourceContext) {
        //console.log("broadcast update elem -> ", mission);
        for (let id in this.contexts) {
            let context = this.contexts[id];
            //console.log("  broadcast, check", context, sourceContext);
            if (context.id != sourceContext.id) {
                let targetMission = context.missions.find(m => m.guid == mission.guid);
                //console.log("    eligible, check for mission = ", targetMission);
                if (targetMission) {
                    targetMission.$known = mission.$known;
                    targetMission.$pending = mission.$pending;
                    context.updateElem(targetMission, true);
                }
            }
        }
    }.bind(PLUGIN);

    PLUGIN.downloadMission = function(mission, callback) {

        console.log("[bannergress] downloadMission", mission);

        // update state and redraw ui element to "pending"
        mission.$pending = true;
        mission.$context.updateElem(mission);

        console.log("[bannergress] loading mission:", mission.guid);

        setTimeout(() => {
            //window.plugin.missions.loadMission(m.mission.guid,
            getMissionDetails(mission.guid,

                function loadMissionOk(details) {

                    const MISSIONS_PLUGIN = window.plugin.missions;

                    console.log("[bannergress] mission loaded:", details);

                    // import new data
                    for (let key in details) mission[key] = details[key];
                    try {
                        let oldEl = mission.$elem;
                        console.debug("[bannergress] re-rendering mission summary element", mission, oldEl);
                        let newEl = MISSIONS_PLUGIN.renderMissionSummary(mission);
                        oldEl.replaceWith(newEl);
                    } catch (err) {
                        console.error("[bannergress] error re-rendering mission summary element", mission, err);
                    }

                    console.log("[bannergress] submitting mission details to backend..", details);

                    PLUGIN.provider.submitMission(details, function(err, submittedMission) {

                        mission.$pending = false;
                        if (err) {

                            console.error("[bannergress] ERROR SUBMITTING MISSION DETAILS TO BACKEND:", { details, err });
                            err.isCritical = true;
                            mission.$context.updateElem(mission);
                            if (callback) callback(err);

                        } else {

                            console.log("[bannergress] successfully submitted mission details to backend:", submittedMission);
                            mission.$known = submittedMission;
                            mission.$context.updateElem(mission);
                            if (callback) callback(null, submittedMission);

                        }

                    })

                },

                function loadMissionFailed(xhr) {

                    let err = new Error("Intel /r/getMissionDetail request failed (" + xhr.statusText + ")");
                    console.error("[bannergress] ERROR QUERYING MISSION DETAILS FROM INTEL:", { mission, err });
                    mission.$pending = false;
                    mission.$context.updateElem(mission);
                    if (callback) callback(err);
                }
            );
        }, 0);
    }.bind(PLUGIN);

    PLUGIN.loadSettings = function() {

        function getKey(key) {
            let json = localStorage.getItem(key);
            if (json == null) return null;
            else {
                try {
                    return JSON.parse(json);
                } catch (err) {
                    return null;
                }
            }
        }

        //console.log("LOAD SETTINGS..");

        this.settings = Object.assign({
            provider: 'disabled',
            moveAutoRefresh: false,
            batchMinimumDelay: 500,
            batchRandomizeExtraDelay: 1000,
            batchMaxHard: 1000,
            batchMaxUser: 300,
            mapControlEnabled: true,
            refreshLockTime: 7 * 24 * 60 * 60 * 1000
        }, getKey("plugin.bannerIndexer.settings") || {});

        //console.log("PLUGIN SETTINGS", this.settings);

        for (let id in this.integrations) {
            let ps = getKey("plugin.bannerIndexer.settings." + id);
            if (ps != null) {
                console.log("[bannergress] loading settings for " + id + ":", ps);
                this.integrations[id].settings = Object.assign({}, this.integrations[id].settings, ps);
            }
        }

        this.provider = this.integrations[this.settings.provider]
            || this.integrations[Object.keys(this.integrations)[0]];

    }.bind(PLUGIN);

    PLUGIN.saveSettings = function() {

        //console.log("SAVE SETTINGS");
        this.settings.provider = this.provider.id;
        localStorage.setItem("plugin.bannerIndexer.settings", JSON.stringify(this.settings));

        this.setupMapControls();

        localStorage.setItem("plugin.bannerIndexer.settings." + this.provider.id, JSON.stringify(this.provider.settings));

    }.bind(PLUGIN)

    PLUGIN.saveProviderSettings = function(provider) {

        if (provider == null) provider = this.provider;

        //console.log("saveProviderSettings", provider.settings);

        localStorage.setItem(
            "plugin.bannerIndexer.settings." + provider.id,
            JSON.stringify(provider.settings)
        );

    }.bind(PLUGIN);

    let lockedColor = `#B4F3F9`;
    let waitColor = `#FACD00`;
    let newColor = '#FFEB31';  //`#FACD00`;
    let updateColor = `#45DC00`;

    PLUGIN.icons = {

        'new': {
            unicode: '🔃',
            svg: `<svg x="0px" y="0px" viewBox="-100 -200 812 712" style="enable-background:new 0 0 512 512" xml:space="preserve">
                <g>
                    <path fill="${newColor}" d="M479.046,283.925c-1.664-3.989-5.547-6.592-9.856-6.592H352.305V10.667C352.305,4.779,347.526,0,341.638,0H170.971
                        c-5.888,0-10.667,4.779-10.667,10.667v266.667H42.971c-4.309,0-8.192,2.603-9.856,6.571c-1.643,3.989-0.747,8.576,2.304,11.627
                        l212.8,213.504c2.005,2.005,4.715,3.136,7.552,3.136s5.547-1.131,7.552-3.115l213.419-213.504
                        C479.793,292.501,480.71,287.915,479.046,283.925z"/>
                </g>
            </svg>
            `,
            __svg: `<svg version="1.1" x="0px" y="0px" width="32" height="32" viewBox="0 0 40 30" style="enable-background:new 0 0 32 32;" xml:space="preserve">
                <path fill="${newColor}" d="M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14S23.7,2,16,2z M20.7,17.7l-4,4c-0.1,0.1-0.2,0.2-0.3,0.2
                    C16.3,22,16.1,22,16,22s-0.3,0-0.4-0.1c-0.1-0.1-0.2-0.1-0.3-0.2l-4-4c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0l2.3,2.3V10c0-0.6,0.4-1,1-1
                    s1,0.4,1,1v8.6l2.3-2.3c0.4-0.4,1-0.4,1.4,0S21.1,17.3,20.7,17.7z"/>
                </svg>
            `,
            _svg: `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                width="438.533px" height="438.533px" viewBox="0 0 500.533 438.533" style="enable-background:new 0 0 438.533 438.533;"
                xml:space="preserve">
                <g>
                    <g>
                        <path fill="${newColor}" d="M409.133,109.203c-19.608-33.592-46.205-60.189-79.798-79.796C295.736,9.801,259.058,0,219.273,0
                            c-39.781,0-76.47,9.801-110.063,29.407c-33.595,19.604-60.192,46.201-79.8,79.796C9.801,142.8,0,179.489,0,219.267
                            c0,39.78,9.804,76.463,29.407,110.062c19.607,33.592,46.204,60.189,79.799,79.798c33.597,19.605,70.283,29.407,110.063,29.407
                            s76.47-9.802,110.065-29.407c33.593-19.602,60.189-46.206,79.795-79.798c19.603-33.596,29.403-70.284,29.403-110.062
                            C438.533,179.485,428.732,142.795,409.133,109.203z M353.742,297.208c-13.894,23.791-32.736,42.633-56.527,56.534
                            c-23.791,13.894-49.771,20.834-77.945,20.834c-28.167,0-54.149-6.94-77.943-20.834c-23.791-13.901-42.633-32.743-56.527-56.534
                            c-13.897-23.791-20.843-49.772-20.843-77.941c0-28.171,6.949-54.152,20.843-77.943c13.891-23.791,32.738-42.637,56.527-56.53
                            c23.791-13.895,49.772-20.84,77.943-20.84c28.173,0,54.154,6.945,77.945,20.84c23.791,13.894,42.634,32.739,56.527,56.53
                            c13.895,23.791,20.838,49.772,20.838,77.943C374.58,247.436,367.637,273.417,353.742,297.208z"/>
                        <path style="fill: #FACD00;" d="M310.633,219.267H255.82V118.763c0-2.666-0.862-4.853-2.573-6.567c-1.704-1.709-3.895-2.568-6.557-2.568h-54.823
                            c-2.664,0-4.854,0.859-6.567,2.568c-1.714,1.715-2.57,3.901-2.57,6.567v100.5h-54.819c-4.186,0-7.042,1.905-8.566,5.709
                            c-1.524,3.621-0.854,6.947,1.999,9.996l91.363,91.361c2.096,1.711,4.283,2.567,6.567,2.567c2.281,0,4.471-0.856,6.569-2.567
                            l91.077-91.073c1.902-2.283,2.851-4.576,2.851-6.852c0-2.662-0.855-4.853-2.573-6.57
                            C315.489,220.122,313.299,219.267,310.633,219.267z"/>
                    </g>
                </svg>
                `
        },

        'indexed': {
            unicode: '🔒',
            svg: `<svg width="20px" height="20px" viewBox="-2 -2 30 30">
                <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g transform="translate(-646.000000, -200.000000)">
                        <g transform="translate(100.000000, 100.000000)">
                            <g transform="translate(544.000000, 98.000000)">
                                <g>
                                    <polygon id="Path" points="0 0 24 0 24 24 0 24"></polygon>
                                    <path fill="${lockedColor}" d="M12,2 C6.48,2 2,6.48 2,12 C2,17.52 6.48,22 12,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 12,2 Z M9.29,16.29 L5.7,12.7 C5.31,12.31 5.31,11.68 5.7,11.29 C6.09,10.9 6.72,10.9 7.11,11.29 L10,14.17 L16.88,7.29 C17.27,6.9 17.9,6.9 18.29,7.29 C18.68,7.68 18.68,8.31 18.29,8.7 L10.7,16.29 C10.32,16.68 9.68,16.68 9.29,16.29 Z"></path>
                                </g>
                            </g>
                        </g>
                    </g>
                </g>
            </svg>
            `,
            _svg: `<svg width="32px" height="32px" viewBox="0 0 40 32">
                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="icon-118-lock-rounded" fill="${lockedColor}">
                            <path d="M16,21.9146472 L16,24.5089948 C16,24.7801695 16.2319336,25 16.5,25 C16.7761424,25 17,24.7721195 17,24.5089948 L17,21.9146472 C17.5825962,21.708729 18,21.1531095 18,20.5 C18,19.6715728 17.3284272,19 16.5,19 C15.6715728,19 15,19.6715728 15,20.5 C15,21.1531095 15.4174038,21.708729 16,21.9146472 L16,21.9146472 Z M9,14.0000125 L9,10.499235 C9,6.35670485 12.3578644,3 16.5,3 C20.6337072,3 24,6.35752188 24,10.499235 L24,14.0000125 C25.6591471,14.0047488 27,15.3503174 27,17.0094776 L27,22 C27,26.4092877 23.4186782,30 19.0008939,30 L13.9991061,30 C9.58616771,30 6,26.418278 6,22 L6,17.0094776 C6,15.339581 7.34233349,14.0047152 9,14.0000125 L9,14.0000125 L9,14.0000125 Z M12,14 L12,10.5008537 C12,8.0092478 14.0147186,6 16.5,6 C18.9802243,6 21,8.01510082 21,10.5008537 L21,14 L12,14 L12,14 L12,14 Z" id="lock-rounded" sketch:type="MSShapeGroup"></path>
                        </g>
                    </g>
                </svg>
                `
        },

        'indexed-refresh': {
            unicode: '✅',
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="41.8" height="42.18" viewBox="-8 -8 66 54">
                <g>
                <path fill="${updateColor}" d="M35.48.59l-3,3A21,21,0,0,0,0,19a2,2,0,0,0,2,2.18H6.07A2,2,0,0,0,8,19.41,13,13,0,0,1,26.58,9.49l-2.27,2.27a2,2,0,0,0,1.42,3.42H36.9a2,2,0,0,0,2-2V2A2,2,0,0,0,35.48.59Z"/>
                <path fill="${updateColor}" d="M39.79,21H35.73a2,2,0,0,0-1.95,1.76A13,13,0,0,1,20.9,34a12.81,12.81,0,0,1-5.68-1.32l2.26-2.27A2,2,0,0,0,16.07,27H4.9a2,2,0,0,0-2,2V40.17a2,2,0,0,0,3.41,1.42l3.05-3.05A20.78,20.78,0,0,0,20.9,42,21,21,0,0,0,41.79,23.18,2,2,0,0,0,39.79,21Z"/>
                </g>
            </svg>
            `
        },

        'pending': {
            unicode: '⏳',
            svg: `<svg version="1.1" x="0px" y="0px" viewBox="0 0 330 296.999" style="enable-background:new 0 0 296.999 296.999;" xml:space="preserve">
                <path fill="${waitColor}" d="M250.923,296.999c5.627,0,10.19-4.563,10.19-10.19c0-5.628-4.563-10.19-10.19-10.19h-17.46l-0.001-31.302
                    c0-31.667-17.378-60.775-48.934-81.964c-3.926-2.636-6.364-8.327-6.364-14.852s2.438-12.217,6.366-14.854
                    c31.554-21.188,48.932-50.295,48.934-81.963V20.381h17.459c5.627,0,10.19-4.563,10.19-10.19S256.55,0,250.923,0H46.076
                    c-5.627,0-10.19,4.563-10.19,10.19s4.563,10.19,10.19,10.19h17.459v31.303c0,31.668,17.378,60.775,48.935,81.964
                    c3.925,2.636,6.363,8.326,6.363,14.853c0,6.526-2.438,12.217-6.364,14.854c-31.556,21.188-48.934,50.295-48.934,81.963v31.302
                    H46.076c-5.627,0-10.19,4.563-10.19,10.19c0,5.628,4.563,10.19,10.19,10.19H250.923z"/>
                </svg>
            `
        }
    }

    PLUGIN.install = function() {

        console.log("[bannergress] installing..");

        const PLUGIN = window.plugin.bannerIndexer;
        const MISSIONS_PLUGIN = window.plugin.missions;

        $("#toolbox").append(
            $("<a>", {
                text: "Bannergress settings",
                click: () => {
                    let d = new SettingsDialog(this);
                    d.show();
                }
            })
        );

        if (!this.initialized) return;
        if (this.provider.requireLogin && !this.provider.isAuthenticated) return;

        // find the missions plugin
        if (!MISSIONS_PLUGIN) {
            dialog({
                title: 'Mission plugin not found',
                id: 'iitc-artifacts',
                html: 'It looks like the IITC mission plugin is not activated. Please activate the plugin in the plugin list under <b>Info → Missions</b>.',
                width: 400,
                position: {
                    my: 'center center',
                    at: 'center center',
                    of: window,
                    collision: 'fit'
                }
            });
            return;
        }

        // traps for window.dialog()
        PLUGIN.captureDialog = false;
        PLUGIN.capturedDialogs = [];
        PLUGIN.captureDialogBefore = null;
        PLUGIN._dialog = window.dialog;
        window.dialog = function() {
            const PLUGIN = window.plugin.bannerIndexer;
            let args = [];
            for (let i = 0; arguments.length > i; i++) args.push(arguments[i]);
            if (PLUGIN.captureDialogBefore) {
                args = PLUGIN.captureDialogBefore(args);
            }
            let dlg = PLUGIN._dialog.apply(window, args);
            if (PLUGIN.captureDialog) {
                PLUGIN.capturedDialogs.push(dlg);
            }
            return dlg;
        }

        // save original window.plugin.missions.renderMissionSummary() and install our intercept
        PLUGIN._renderMissionSummary = MISSIONS_PLUGIN.renderMissionSummary;
        MISSIONS_PLUGIN.renderMissionSummary = function() {

            let args = [];
            for (let i = 0; arguments.length > i; i++) args.push(arguments[i]);
            //console.log("-----------> renderMissionSummary", args);

            let mission = args[0];
            if (mission.$context == null) {
                console.warn("[bannergress] ENCOUNTERED MISSION WITHOUT CONTEXT -- WHERE DOES THIS BELONG?");
            }

            // call original
            let el = PLUGIN._renderMissionSummary.apply(MISSIONS_PLUGIN, args);
            mission.$elem = el;
            mission.$ours = null; // force re-generation

            return el;
        }

        PLUGIN.createContext = function(argz, real, methodName, type, handler) {

            const PLUGIN = window.plugin.bannerIndexer;
            const MISSIONS_PLUGIN = window.plugin.missions;

            let res = undefined;
            let args = [];
            for (let i = 0; argz.length > i; i++) args.push(argz[i]);
            //console.log("-----------> " + methodName, args);

            // create a new context
            let context = new DialogContext(PLUGIN, type);
            PLUGIN.contexts[context.id] = context;
            PLUGIN.contextStack.push(context);

            // ensure we have an array of missions, even if just one
            let missionObjects = args[0];
            if (!(missionObjects instanceof Array)) {
                missionObjects = [ missionObjects ];
            }

            // create copies of all missions, as we can't modify the original items
            // because they are serialized for caching
            context.missions = missionObjects.map(m => {
                let m2 = Object.assign({}, m);
                m2.$context = context;
                m2.$pending = true;
                return m2;
            })

            try {
                // call handle before
                handler(context, args, false);

                // call the real method and capture any dialogs
                PLUGIN.capturedDialogs = [];
                PLUGIN.captureDialog = true;
                res = real.apply(MISSIONS_PLUGIN, args);

                // attach to captured dialogs
                PLUGIN.captureDialog = false;
                PLUGIN.captureDialogBefore = null;
                if (PLUGIN.capturedDialogs.length) {

                    // set the dialog in the context, and attatch a data-* attribute
                    // to it so we can figure out where we are later
                    let dialog = PLUGIN.capturedDialogs[0];
                    //console.log("ATTATCHING TO DIALOG", dialog);
                    context.dialog = dialog;
                    $(dialog).attr("data-bannerindexer-context", context.id);

                    // query server and join results
                    let stopCheck = false;
                    let waitDlg = new ProgressDialog(PLUGIN, () => {
                        stopCheck = true;
                    })

                    waitDlg.show(() => {

                        waitDlg.setExtra("");
                        waitDlg.setProgress(0, 1);
                        waitDlg.setStatus("");

                        context.updateElems();

                        let jobSize = 250;
                        let jobs = [];
                        let results = [];

                        for (let i = 0; context.missions.length > i; i += jobSize) {
                            jobs.push(context.missions.slice(i, i+jobSize));
                        }
                        console.debug("[bannergress] check-status-jobs:", jobs);

                        let numErrors = 0;
                        let jobNo = 0;
                        let attemptNo = 0;
                        const next = () => {
                            let job = jobs[jobNo];
                            if (!stopCheck && job != null) {

                                //console.log("job", job);

                                waitDlg.setStatus(`Please wait, checking mission statuses (${jobNo*jobSize}/${context.missions.length})`);
                                waitDlg.setExtra("");
                                waitDlg.setProgress(jobNo+1, jobs.length);

                                PLUGIN.provider.checkMissions(job, (err, statuses) => {
                                    if (err) {
                                        ++numErrors;
                                        waitDlg.setExtra("ERROR! There was an error checking mission statuses:\n\n" + err.message);
                                        console.error("[bannergress] ERROR: Failed to check missions statuses:", err);
                                        ++attemptNo;
                                        if (attemptNo > 5) {
                                            attemptNo = 0;
                                            jobNo++; // skip it
                                        }
                                        setTimeout(() => next(), 1000); // retry current
                                    } else {
                                        results = results.concat(statuses);
                                        waitDlg.setExtra("");
                                        jobNo++;
                                        attemptNo = 0; // reset
                                        next(); //setTimeout(() => next(), 1000);
                                    }
                                });

                            } else {

                                waitDlg.close();

                                if (numErrors > 0) {
                                    alert("Warning: there were errors while checking mission statuses - you might want to check the javascript console for errors, and report this to the support group on Telegram!");
                                }

                                //console.log("CHECKED", statuses);
                                results.forEach(status => {
                                    let mission = context.missions.find(c => c.guid == status.guid);
                                    if (mission) {
                                        mission.$known = status;
                                    } else {
                                        console.error("[bannergress] ERROR: Server returned status for mission we did not ask for?", status);
                                    }
                                })

                                // clear pending status
                                context.missions.forEach(mission => {
                                    mission.$pending = false;
                                })

                                // update all elements
                                context.updateElems();

                                // call handler after
                                handler(context, args, true);

                            }
                        }
                        next();

                    });

                }

            } finally {
                //console.log("-----------> " + methodName + " END ---->", res);
                PLUGIN.contextStack = PLUGIN.contextStack.filter(c => c != context);
            }

            return res;
        }

        PLUGIN._openTopMissions = MISSIONS_PLUGIN.openTopMissions;
        PLUGIN._openPortalMissions = MISSIONS_PLUGIN.openPortalMissions;
        PLUGIN._openMission = MISSIONS_PLUGIN.openMission;

        MISSIONS_PLUGIN.openTopMissions = function() {
            const PLUGIN = window.plugin.bannerIndexer;
            PLUGIN.constraints = {
                time: Date.now(),
                context: 'openTopMissions',
                bounds: map.getBounds()
            }
            console.debug("[bannergress] openTopMissions", PLUGIN.constraints);
            return PLUGIN._openTopMissions.call(MISSIONS_PLUGIN);
        }

        MISSIONS_PLUGIN.openPortalMissions = function() {
            const PLUGIN = window.plugin.bannerIndexer;
            PLUGIN.constraints = {
                time: Date.now(),
                context: 'openPortalMissions',
                portalGuid: window.selectedPortal
            }
            console.debug("[bannergress] openPortalMissions", PLUGIN.constraints);
            return PLUGIN._openPortalMissions.call(MISSIONS_PLUGIN);
        }

        MISSIONS_PLUGIN.openMission = function(guid) {
            const PLUGIN = window.plugin.bannerIndexer;
            PLUGIN.constraints = {
                time: Date.now(),
                context: 'openMission',
                missionGuid: guid
            }
            console.debug("[bannergress] openMission", PLUGIN.constraints);
            return PLUGIN._openMission.call(MISSIONS_PLUGIN, guid);
        }

        // save original window.plugin.missions.showMissionListDialog() and install our hook
        PLUGIN._showMissionListDialog = MISSIONS_PLUGIN.showMissionListDialog;
        MISSIONS_PLUGIN.showMissionListDialog = function() {
            // WARNING! {this} and scope may be lost here - do not assume anything!
            console.debug("[bannergress] showMissionListDialog", arguments);
            const PLUGIN = window.plugin.bannerIndexer;
            return PLUGIN.createContext(arguments, PLUGIN._showMissionListDialog, 'showMissionListDialog', 'list',
            (context, args, isAfter) => {
                if (!isAfter) {
                    console.log("CALLBACK BEFORE", context);
                    //console.log("_____constraints", PLUGIN.constraints);
                    context.origin = PLUGIN.constraints;
                    PLUGIN.constraints = null;
                    args[0] = context.missions;
                } else {
                    console.log("CALLBACK AFTER", context);
                    //console.log("_____constraints", PLUGIN.constraints);
                    let opts = {};
                    if (!isSmartphone()) {
                        opts.height = Math.round(window.innerHeight * 0.9);
                        if (window.innerWidth > 600) opts.width = 600;
                    }
                    context.dialog.dialog('option', opts);
                    context.injectUI();
                }
            });
        }

        // save original window.plugin.missions.showMissionDialog() and install our hook
        PLUGIN._showMissionDialog = MISSIONS_PLUGIN.showMissionDialog;
        MISSIONS_PLUGIN.showMissionDialog = function() {
            // WARNING! {this} and scope may be lost here - do not assume anything!
            console.debug("[bannergress] showMissionDialog", arguments);
            const PLUGIN = window.plugin.bannerIndexer;
            return PLUGIN.createContext(arguments, PLUGIN._showMissionDialog, 'showMissionDialog', 'single',
            (context, args, isAfter) => {
                if (!isAfter) {
                    //console.log("CALLBACK BEFORE", context);
                    //console.log("_____constraints", PLUGIN.constraints);
                    context.origin = PLUGIN.constraints;
                    PLUGIN.constraints = null;
                    args[0] = context.missions[0];
                } else {
                    //console.log("_____constraints", PLUGIN.constraints);
                    //console.log("CALLBACK AFTER", context);
                }
            });
        }

        setTimeout(MISSIONS_PLUGIN.onIITCLoaded.bind(MISSIONS_PLUGIN)); // this will refresh the displayed mission dialog

    }.bind(PLUGIN);

    PLUGIN.setupMapControls = function() {

        if (this.settings.mapControlEnabled) {
            if (!this.mapControl)
                this.mapControl = new PLUGIN.MissionsControl();
                map.addControl(this.mapControl);
        } else {
            if (this.mapControl) {
                map.removeControl(this.mapControl);
                this.mapControl = null;
            }
        }
        // if (isSmartphone()) {
        // }

    }.bind(PLUGIN);

    PLUGIN.setup = function () {

        console.log("[bannergress] setup");

        // CHECK FOR USAGE OF IITC.me
        // show a warning the first time IITC loads
        // show a warning with a checkbox (to not show the warning) the next times IITC loads
        // hide the warning if the user enabled the checkbox
        // show the warning again if the version of Bannergress has changed
        let iitcversion = window.script_info.script.version;
        let iitcmainversion = iitcversion.replace(/^(\d+\.\d+).*$/,'$1');
        if (iitcmainversion == '0.26') {
            let iitcversioncheck = {};
            function loadiitcversioncheck() {
                try {
                    iitcversioncheck = JSON.parse(localStorage['bannergressiitcversioncheck']);
                    if (iitcversioncheck.bannergressversion != plugin_info.script.version) { // show the warning again if the version of Bannergress has changed
                        iitcversioncheck.showwarning = true;
                    }
                } catch(e) {
                    iitcversioncheck = {}; // show a warning the first time IITC loads, without a checkbox
                }
            }
            function storeiitcversioncheck() {
                localStorage['bannergressiitcversioncheck'] = JSON.stringify(iitcversioncheck);
            }
            loadiitcversioncheck();
            if (!('showwarning' in iitcversioncheck) || iitcversioncheck.showwarning) {
                let container = document.createElement('div');
                container.innerHTML = '<p><b>Bannergress warning:</b></p>' +
                    '<p>You are using an older version of <a onclick="window.aboutIITC()" style="cursor: help">IITC</a><br>' +
                    'version ' + iitcversion + '</p>' +
                    '<p>The Bannergress plugin may not work as intended with this version of IITC.</p>' +
                    '<p>You are encouraged to download the lastest release version of IITC-CE instead.</p>' +
                    '<p>Go to <a href="https://iitc.app/" target="_blank">https://iitc.app/</a> and download from there.</p>';
                if ('showwarning' in iitcversioncheck && iitcversioncheck.showwarning) {
                    let label = container.appendChild(document.createElement('label'));
                    let checkbox = label.appendChild(document.createElement('input'));
                    checkbox.type = 'checkbox';
                    checkbox.addEventListener('change',function() {
                        iitcversioncheck.showwarning = !this.checked;
                        storeiitcversioncheck();
                    },false);
                    label.appendChild(document.createTextNode(' Do not warn me again'));
                }
                window.dialog({
                    html: container,
                    title: 'Bannergress ' + plugin_info.script.version
                });
                // store initial values
                iitcversioncheck.bannergressversion = plugin_info.script.version;
                iitcversioncheck.showwarning = true; // show a warning with a disable checkbox the next times IITC loads
                storeiitcversioncheck();
            }
        } else {
            delete localStorage['bannergressiitcversioncheck'];
        }

        this.initialized = false;
        this.setupCSS();
        this.loadSettings();
        this.registerMissionsControl();

        if (window.plugin.missions.showMissionListDialog.toString().match('isShowingPortalList')) {
            console.log("[bannergress] replace function showMissionListDialog from Missions 0.3.0 with function from Missions 0.2.2..");
            window.plugin.missions.showMissionListDialog = function(missions) {
                window.dialog({
                    html: this.renderMissionList(missions),
                    height: 'auto',
                    width: '400px',
                    collapseCallback: this.collapseFix,
                    expandCallback: this.collapseFix,
                }).dialog('option', 'buttons', {
                    'Create new mission': function() { open('//missions.ingress.com'); },
                    'OK': function() { $(this).dialog('close'); },
                });
            };
        }

        console.log("[bannergress] initializing..");
        this.provider.initialize(err => {
            if (err) {
                console.error("[bannergress] Error while initializing:", err);
                alert("Error initializing Bannergress plugin:\n\n" + err.message);
            } else {
                console.log("[bannergress] initialized!");
                this.initialized = true;
            }

            // There are some plugins that patch various methods we
            // patch - in somewhat weird ways - so let them do their work
            // first, if installed
            setTimeout(() => {

                this.install();

                if (this.provider.requireLogin && !this.provider.isAuthenticated) {
                    let d = new SettingsDialog(this);
                    d.showRequireLogin = true;
                    d.show();
                }

            }, 100);
        });

        this.setupMapControls();

    }.bind(PLUGIN);

    console.log("[bannergress] script loaded");

    let setup = function () {
        setTimeout(() => PLUGIN.setup(), 100);
    }

    // PLUGIN END //////////////////////////////////////////////////////////

    setup.info = plugin_info; //add the script info data to the function as a property

    if (!window.bootPlugins) {
        window.bootPlugins = [];
    }
    window.bootPlugins.push(setup);

    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded) {
        setup();
    }

} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
};
}
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
