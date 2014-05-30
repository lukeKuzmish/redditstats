// **************************************
// **************************************
// **************************************
// ********** UserData Object ***********
// **************************************
function UserData(username) {
  this.username = username || "";
  this.postsPerSub = {};
  this.sortedPostsPerSub = [];
}

UserData.prototype.increaseSubredditCount = function(subreddit) {
  if (this.postsPerSub[subreddit] === undefined) {
    this.postsPerSub[subreddit] = 1;
  }
  else {
    this.postsPerSub[subreddit]++;
  }
  return;
}

UserData.prototype.getUserInfoUrl = function(after) {
  var url = "http://www.reddit.com/user/" + this.username + "/overview.json?limit=200";
  if (after) {
    url += "&after=" + after;
  }
  return url;
}

UserData.prototype.sort = function(mode) {

  function SubCount(sub, count) {
    this.sub = sub;
    this.count = count;
  }

  var sub, count, sortedKeysDesc,
      that = this;
  
  mode = mode || "desc";

  sortedKeysDesc = Object.keys(this.postsPerSub).sort(function(a,b) {
    if (mode === "desc") {
      return that.postsPerSub[b] - that.postsPerSub[a];
    }
    else if (mode === "asc") {
      return that.postsPerSub[a] - that.postsPerSub[b];
    }
  });

  for (var i=0; i<sortedKeysDesc.length; i++) {
    
    sub = sortedKeysDesc[i];
    count = this.postsPerSub[sub];
    this.sortedPostsPerSub.push(new SubCount(sub, count));
  }

}

// ********************************************
// ********************************************
// ************ end UserData obj **************
// ********************************************
// ********************************************



$(document).ready(function() {

    var paramString, paramArr, tmp, stateString,
        paramHash = {};

    // in case browser doesn't support autofocus
    if (!("autofocus" in document.createElement("input"))) {
        $("#username").focus();
    }

    $("#reddituserform").submit(function(event) {
      userdata = new UserData($('#username').val());
      
      //userdata.username = $('#username').val();
      stateString = "?username=" + userdata.username;
      /*
       *  I dunno if this is a good idea or not...?  either way, the code is there
       *
       
      // keeps autoload param in Hash (if it was set to true to begin with)
      if ('autoload' in paramHash && paramHash['autoload'] == 'true') {
        stateString += "&autoload=true";
      }
      */
      history.pushState(null,null,stateString);
      
      // initialize pulling
      console.log("begin pulling data");
      $("input").prop('disabled', true);
      $("#search").addTextLoading();
      
      // just in case there's something already in #results
      $("#results").fadeOut(500);
      
      getRedditListing(null, function() {
        var statsP = $("#stats"),
            postsCount = 0,
            userUrl = "http://www.reddit.com/user/" + userdata.username + "/";
            
        console.log('done pulling data');
        ajaxPullCleanup();
        userdata.sort('desc');
        drawBarChart();
        
        // create stats div
        postsCount = userdata.sortedPostsPerSub.reduce(function(a,b) { return a + b.count; }, 0);
        statsP.html($("<a/>", {href: userUrl, target: "_blank", text: userdata.username})).append(": " + postsCount + " total posts");
        $("#results").fadeIn(500);
      });
        
      event.preventDefault();
        
  });
  
  /*
   * check param string
   *
   *  @autoload  (boolean)    automatically pulls the data from the API
   *                          without using having to click submit.
   *                          (REQUIRES that username is passed too)
   *
   *  @username   (string)    if this is passed, the text field is prepopulated
   *                          with the value.
   */
  if (document.location.search) {
    paramString = document.location.search.slice(1);
    paramArr = paramString.split('&');
    paramArr.forEach(function(param) {
      tmp = param.split('=');
      paramHash[tmp[0]] = tmp[1];
    });
    if ('username' in paramHash) {
      $('#username').val(paramHash['username']);
      if ('autoload' in paramHash && paramHash['autoload'] === "true") {
        $('#reddituserform').submit();
      }
    }
  }
});



function getRedditListing(after, callback) {
  //var redditUrl = after ? userdata.getUserInfoUrl(after) : userdata.getUserInfoUrl();
  var redditUrl = userdata.getUserInfoUrl(after);
  
  $.getJSON(redditUrl, function(json) {
    // TODO -- handle 404 (ie. bad username)
    if (json.error) {
          //something bad happened
          displayError(json.error.toString());
          
          return false;
    }
    children = json.data.children;
    children.forEach(function(child) {
      userdata.increaseSubredditCount(child.data.subreddit);
      
    });
    
    after = json.data.after;
    if (after !== null) {
      getRedditListing(after, callback);
    }
    else {
      callback();
    }
  }).fail(function(jqXhr, textStatus, error) {
    //alert('an error occured');
    displayError(error);
  }); //getJSON
  
} // getRedditListing
    

    

    
function ajaxPullCleanup() {
  $("input").prop('disabled', false);
  $("#search").removeTextLoading();
}

function displayError(err) {
  var errorP = $("<p/>", {class: "error"}),
      text = "Error: " + err.toString();
  errorP.text(text);
  //$("#search").append(errorP);
  //$("#results").fadeIn(500);
  // ugh.. for right now, an alert
  alert(text);
  ajaxPullCleanup();
  return;
}

function createNewChartItem(subreddit, posts, percent) {
  var toReturn = $("<li/>"),
      url = "http://reddit.com/r/" + subreddit.toString();
  
  url += "/search?syntax=cloudsearch&q=author%3A%27" + userdata.username + "%27&restrict_sr=on&sort=new";
  percent = percent.toString() + "%";
  
  toReturn.append($("<a/>", {href : url, target : "_blank", text : subreddit}));
  toReturn.append($("<span/>", {class : 'count', text : posts.toString()}));
  toReturn.append($("<span/>", {class : 'index', css : {width: percent}, text : percent}));
  
  return toReturn;
  
}

function createBarChartMaxValue(highestPosts) {
  // max of Chart is 10% more than highestPosts count
  return Math.ceil(highestPosts * 1.1).toFixed();
}

function drawBarChart() {
  /*
<ul id="barchartlist" class="chartlist">
<li>
<a href="http://www.example.com/fruits/apples/">Apples</a>
<span class="count">420</span>
<span class="index" style="width: 100%">(42%)</span>
</li>
.
.
.
</ul>
  */
  var barChart = $("#barchartlist"),
      max = createBarChartMaxValue(userdata.sortedPostsPerSub[0].count), /* note: this assumes desc sort value */
      newLi,
      percent;

  // delete anything already in the UL
  barChart.html('');
  userdata.sortedPostsPerSub.forEach(function(obj) {
    percent = ( (obj.count / max) * 100).toFixed(2);
    newLi = createNewChartItem(obj.sub, obj.count, percent );
    barChart.append(newLi);
  });
  
}