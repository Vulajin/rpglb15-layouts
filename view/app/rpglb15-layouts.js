(function() {
    'use strict';

    // Selectors for schedule
    var $gameTitle = $('.game-title');
    var $gameCategory = $('.game-srDetails-category');
    var $gameEstimate = $('.game-srDetails-estimate');
    var $runner1 = $('#runner1');
    var $runner2 = $('#runner2');
    var $runner3 = $('#runner3');
    var $runner4 = $('#runner4');
    var runnerEls = [
        $runner1,
        $runner2,
        $runner3,
        $runner4
    ];
    var runnerTls = [
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 })
    ];
    var socialTls = [
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 })
    ]
    var $totalAmt = $('.donations-total');

    if (window.layoutName !== 'finale') {
        nodecg.declareSyncedVar({
            name: 'schedule',
            setter: function(newVal) {
                var currentRun = nodecg.variables.currentRun;
                if (currentRun) {
                    var len = newVal.length;
                    for (var i = 0; i < len; i++) {
                        if (currentRun.name === newVal[i].name) {
                            var newIndexOfCurrentRun = newVal[i].index;
                        }
                    }

                    var nextRun = newVal[newIndexOfCurrentRun + 1];
                    setOnDeck(nextRun);
                } else {
                    // default to second run
                    setOnDeck(newVal[1]);
                }
                
                generateUpcoming();
            }
        });

        nodecg.declareSyncedVar({
            name: 'currentRun',
            initialVal: 0,
            setter: function(newVal) {
                setCurrentRun(newVal);

                var nextRun = nodecg.variables.schedule[newVal.index + 1];
                setOnDeck(nextRun);
                generateUpcoming();
            }
        });
    }

    nodecg.declareSyncedVar({
        name: 'total',
        initialVal: 0,
        setter: function(newVal) {
            var money = parseFloat(newVal).formatMoney(); //#verifyvenuz
            if ($totalAmt.text() == money) return;
            var tl = new TimelineLite();
            tl.to($totalAmt, 0.4, {
                opacity: 0,
                onComplete: function() {
                    $totalAmt.html(money);
                }
            });
            tl.to($totalAmt, 0.4, {
                opacity: 1
            });
        }
    });

    var $donations = $('.donations');
    var $upNext = $('.upnext');
    var rotationTl = new TimelineMax({repeat: -1});
    function setUpExtraRotation() {
        rotationTl.pause();
        rotationTl.seek(0);
        rotationTl.clear();

        if (!$donations || !$upNext) return;

        rotationTl.to($donations, 0.5, {opacity: 0}, '+=60');
        rotationTl.to($upNext, 0.5, {opacity: 1});

        rotationTl.to($upNext, 0.5, {opacity: 0}, '+=60');
        rotationTl.to($donations, 0.5, {opacity: 1});

        rotationTl.play();
    }

    setUpExtraRotation();

    function setCurrentRun(run) {
        if (window.noCurrentRun) return;

        if ($gameTitle.text().trim() !== run.game) {
            $gameTitle.html(run.game);
            textFit($gameTitle, { multiLine: false, maxFontSize: parseInt($gameTitle.css('font-size')) });
        }

        // Estimate does not need to be textFit
        if ($gameEstimate.text().trim() !== run.estimate) {
            $gameEstimate.html(run.estimate);
        }

        if ($gameCategory.text().replace(' - Estimate:&nbsp;', '').trim() !== run.category) {
            $gameCategory.html(run.category + ' - Estimate:&nbsp;');
            textFit($gameCategory, { multiLine: false, maxFontSize: parseInt($gameCategory.css('font-size')) });
        }
        
        runnerEls.forEach(function($el, i) {
            // check if the selector has any elements, most views don't actually have 4 runners
            if (!$el[0]) return;

            var $runnerName = $el.children('.runner');
            var $socialName = $el.children('.runner-social');

            // check if there is a runner for this el first
            if (!run.runners[i]) {
                $runnerName.html('');
                runnerTls[i].pause();

                if ($socialName) {
                    $socialName.html('');
                    socialTls[i].pause();
                }
                return;
            }

            // Fill runner name blank if available
            if ($runnerName) {
                var mainContents = '';
                var altContents = '';
                var twitchAndRunnerMatch = false;
                var showTwitch = false;

                runnerTls[i].pause();
                runnerTls[i].seek(0);
                runnerTls[i].clear();

                if ($runnerName.hasClass('runner-info-short') && run.streamlinks[i]) {
                    showTwitch = true;
                }

                if (run.streamlinks[i] && run.runners[i].toLowerCase() == run.streamlinks[i].toLowerCase()) {
                    twitchAndRunnerMatch = true;
                }

                if (showTwitch && twitchAndRunnerMatch) {
                    mainContents = '<img class="social twitch" />' + run.runners[i];
                } else {
                    mainContents = run.runners[i];

                    if (showTwitch) {
                        altContents = '<img class="social twitch" />' + run.streamlinks[i];
                    }
                }

                $runnerName.html(mainContents);

                if (showTwitch && !twitchAndRunnerMatch) {
                    [altContents, mainContents].forEach(function(name) {
                        runnerTls[i].set($runnerName, {
                            onStart: function() {
                                TweenLite.to($runnerName, 0.3, {
                                    opacity: '0',
                                    ease: Power1.easeIn,
                                    onComplete: function() {
                                        $runnerName.html(name);
                                        TweenLite.to($runnerName, 0.3, {
                                            opacity: '1',
                                            ease: Power1.easeOut
                                        }, '0.3');
                                    }
                                });
                            }
                        }, '+=30');
                    });

                    runnerTls[i].play();
                }
            }

            // Fill social details if possible
            if ($socialName) {
                var mainContents = '';
                var altContents = '';
                var twitchAndTwitterMatch = false;
                var needsSwitch = false;

                socialTls[i].pause();
                socialTls[i].seek(0);
                socialTls[i].clear();

                if ($socialName.hasClass('runner-info-short') && run.streamlinks[i] && run.twitterlinks[i]) {
                    needsSwitch = true;
                }

                if (run.streamlinks[i] && run.twitterlinks[i] && run.streamlinks[i].toLowerCase() == run.twitterlinks[i].toLowerCase()) {
                    twitchAndTwitterMatch = true;
                    needsSwitch = false;
                }

                if (run.streamlinks[i]) {
                    mainContents = '<img class="social twitch" />'

                    if (!twitchAndTwitterMatch) {
                        mainContents = mainContents + run.streamlinks[i];
                    }

                    if (!twitchAndTwitterMatch && !needsSwitch) {
                        mainContents = mainContents + '<div style="display:inline-block;width:16px"></div>';
                    }
                }

                if (run.twitterlinks[i]) {
                    if (needsSwitch) {
                        altContents = '<img class="social twitter" />' + run.twitterlinks[i];
                    } else {
                        mainContents = mainContents + '<img class="social twitter" />' + run.twitterlinks[i];
                    }
                }

                $socialName.html(mainContents);

                if (needsSwitch) {
                    [altContents, mainContents].forEach(function(name) {
                        socialTls[i].set($socialName, {
                            onStart: function() {
                                TweenLite.to($socialName, 0.3, {
                                    opacity: '0',
                                    ease: Power1.easeIn,
                                    onComplete: function() {
                                        $socialName.html(name);
                                        TweenLite.to($socialName, 0.3, {
                                            opacity: '1',
                                            ease: Power1.easeOut
                                        }, '0.3');
                                    }
                                });
                            }
                        }, '+=30');
                    });

                    socialTls[i].play();
                }
            }
        });
    }

    /**************/
    /*  ROTATION  */
    /**************/
    var $upnextGame = $('.upnext-game');

    function setOnDeck(run) {
        if (!run) return;

        var text = run.game;

        if (run.category.toLowerCase() != 'any%') {
            text = text + ' (' + run.category + ')';
        }

        $upnextGame.html(text);
        textFit($upnextGame, { multiLine: true, maxFontSize: parseInt($upnextGame.css('font-size')) });
    }

    /***************/
    /*   CURTAIN   */
    /***************/
    function generateUpcoming() {
        if (window.layoutName !== 'curtain') return;

        var schedule = nodecg.variables.schedule;
        var currentRun = nodecg.variables.currentRun;

        if (!schedule || !currentRun) return;

        // fill the upcomingRuns array with the next 3 runs (if there are that many left)
        var runIdx = null;
        $upcoming.html('<div class="rotation-upcoming-label">Coming up...</div>');
        for (var i = 0; i < 3; i++) {
            runIdx = parseInt(currentRun.index) + i;
            if (!schedule[runIdx]) continue;
            $upcoming.append(
                '<div class="rotation-upcoming-run">' +
                    '<div class="rotation-upcoming-run-title font-gameGirl">'+ schedule[runIdx].game +'</div>' +
                    '<div class="rotation-upcoming-run-runners">'+ schedule[runIdx].runners.join(', ') +'</div>' +
                '</div>'
            );

        }

    }
})();