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
    var $totalAmt = $('.footer-total-amount');
    var $upcoming = $('.rotation-upcoming');

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
            var mony = parseFloat(newVal).formatMoney(); //#verifyvenuz
            if ($totalAmt.text() == mony) return;
            var tl = new TimelineLite();
            tl.to($totalAmt, 0.4, {
                opacity: 0,
                onComplete: function() {
                    $totalAmt.html(mony);
                }
            });
            tl.to($totalAmt, 0.4, {
                opacity: 1
            });
        }
    });

    function setCurrentRun(run) {
        if (window.noCurrentRun) return;

        TweenLite.set($gameTitle, {perspective:400});
        TweenLite.set($gameEstimate, {perspective:400});

        var tl = new TimelineLite({ paused: true }),
            splits = {};

        if ($gameTitle.text().trim() !== run.game) {
            $gameTitle.html(run.game);
            textFit($gameTitle, { multiLine: false, maxFontSize: parseInt($gameTitle.css('font-size')) });
            splits.$gameTitle = new SplitText($gameTitle.children('.textFitted'), {type:"chars"});
            tl.staggerFrom(splits.$gameTitle.chars, 0.8, {opacity:0, scale:0, y:80, rotationX:180, transformOrigin:"0% 50% -50",  ease:Back.easeOut}, 0.01, "0");
        }

        // Estimate does not need to be textFit
        if ($gameEstimate.text().trim() !== run.estimate) {
            $gameEstimate.html(run.estimate);
            splits.$gameEstimate = new SplitText($gameEstimate, {type:"chars"});
            tl.staggerFrom(splits.$gameEstimate.chars, 0.8, {opacity:0, y:-10, ease:Back.easeOut}, 0.01, "0");
        }

        if ($gameCategory.text().replace(' -&nbsp;', '').trim() !== run.category) {
            $gameCategory.html(run.category + ' -&nbsp;');
            textFit($gameCategory, { multiLine: false, maxFontSize: parseInt($gameCategory.css('font-size')) });
            splits.$gameCategory = new SplitText($gameCategory.children('.textFitted'), {type:"chars"});
            tl.staggerFrom(splits.$gameCategory.chars, 0.8, {opacity:0, y:-10, ease:Back.easeOut}, 0.01, "0");
        }
        
        runnerEls.forEach(function($el, i) {
            // check if the selector has any elements, most views don't actually have 4 runners
            if (!$el[0]) return;

            var $runnerName = $el.children('.runner');
            var $socialName = $el.children('.runner-social');

            // check if there is a runner for this el first
            if (!run.runners[i]) {
                $runnerName.html('Speedrunner');
                if ($twitchName) $twitchName.html('');
                if ($twitterName) $twitterName.html('');
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
                        }, '+=5');
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
                        }, '+=5');
                    });

                    socialTls[i].play();
                }
            }

            // Don't do any of this other crap - don't alternate
            return;

            // if runner doesn't have a twitch channel, return
            if (!run.streamlinks[i]) return;

            // if name and twitch channel are identical, return
            if (isNameEqualToTwitch) return;

            // else, name and twitch channel aren't identical and we must alternate between them
            [twitchName, run.runners[i]].forEach(function(name) {
                runnerTls[i].set($el, {
                    onStart: function() {
                        TweenLite.to($el.children('.textFitted'), 0.3, {
                            left: '30px',
                            opacity: '0',
                            ease: Power1.easeIn,
                            onComplete: function() {
                                $el.html(name);
                                textFit($el, { multiLine: false, alignVert: true, maxFontSize: parseInt($el.css('font-size')) });
                                TweenLite.from($el.children('.textFitted'), 0.3, {
                                    left: '-30px',
                                    opacity: '0',
                                    ease: Power1.easeOut
                                }, '0.3');
                            }
                        });
                    }
                }, '+=30');
            });
            
            runnerTls[i].play();
        });
        
        tl.play();
    }

    /**************/
    /*  ROTATION  */
    /**************/
    var $upnextGame = $('.upnext-game');

    function setOnDeck(run) {
        if (!run) return;

        var text = run.game;

        $upnextGame.html(text);
        textFit($upnextGame, { multiLine: false, maxFontSize: parseInt($upnextGame.css('font-size')) });
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