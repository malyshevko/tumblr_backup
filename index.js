var tumblr = require('tumblr.js');
const util = require('util');
const mime = require('mime-types')
const rp = require('request-promise-native');
var fs = require('fs');
var cookieJar = rp.jar();
const keys = require('./keys');


var client = tumblr.createClient({
	consumer_key: keys.consumer_key,
	consumer_secret: keys.consumer_secret,
	token: keys.token,
	token_secret: keys.token_secret
});

const userLikes = util.promisify(client.userLikes);


async function main(){
	var likes = [];
	var res = await userLikes({limit: '20'});
	var all = 20;
	var count = res.liked_count;
	var before = res['_links'].next.href.match(/\d{6,}/);
	if(before){
		before = before[0];
	}else{
		before = false;
	}
	res = res.liked_posts;
	while(before){
		
		for(var i = 0; i<res.length; i++){
			if(res[i].video_url){
				likes.push(res[i].video_url);
			}else if(url = res[i].trail[0].content_raw.match(/(http.*\.mp4)","media"/)){
				likes.push(url[1]);
			}else if(url = res[i].trail[0].content_raw.match(/http[^<>"]*\.(jpg|png)/g)){
				for(var k=0; k<url.length; k++){
					likes.push(url[k]);
				}
			}else if(res[i].photos){
				for(var k=0; k<res[i].photos.length; k++){
					likes.push(res[i].photos[k].original_size.url);
				}
			}else{
				console.log(res[i])
			}
		}
		var res = await userLikes({limit: '20', before: before});
		if(res.liked_posts.length > 0){
			before = res['_links'].next.href.match(/\d{6,}/)[0];
			all += 20;
			console.log(all + ' из ' + count);
		}else{
			before = false;
		}
		res = res.liked_posts;
	}
	res = '';
	for (var i = 0; i < likes.length; i++) {
		if (!fs.existsSync('backup')){
			fs.mkdirSync('backup');
		}
		console.log((i+1) + ' из ' + likes.length)
		try{
			res = await rp({
				method: 'GET',
				uri: likes[i],
				resolveWithFullResponse: true, // optional, otherwise replace `res.body` with just `res` below
				encoding: null,
				jar: cookieJar
			});
		} catch(e){
			console.log(likes[i])
		}
		var downFile = fs.createWriteStream('backup/' + likes[i].match(/\/(\w+.\w{2,4})$/)[1]);
		downFile.write(res.body);
		downFile.end();
	}
}

main();