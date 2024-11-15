(function () {
	function findLine(sdpLines, prefix, substr) {
		return findLineInRange(sdpLines, 0, -1, prefix, substr);
	}
	function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine != -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr || sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					return i;
				}
			}
		}
		return null;
	}
	function getCodecPayloadType(sdpLine) {
		var pattern = new RegExp("a=rtpmap:(\\d+) \\w+\\/\\d+");
		var result = sdpLine.match(pattern);
		if (result && result.length == 2) {
			return result[1];
		} else {
			return null;
		}
	}
	function setDefaultCodec(mLine, payload) {
		var elements = mLine.split(" ");
		var newLine = [];
		var index = 0;
		for (var i = 0; i < elements.length; i++) {
			if (index === 3) {
				newLine[index++] = payload;
			}
			if (elements[i] !== payload) {
				newLine[index++] = elements[i];
			}
		}
		return newLine.join(" ");
	}
	function setCompat() { }
	function checkCompat() {
		return true;
	}
	function onStreamError(self, e) {
		console.log("There has been a problem retrieving the streams - did you allow access? Check Device Resolution", e);
		doCallback(self, "onError", e);
	}
	function onStreamSuccess(self, stream) {
		console.log("Stream Success");
		doCallback(self, "onStream", stream);
	}
	function onRemoteStreamSuccess(self, stream) {
		console.log("Remote Stream Success");
		doCallback(self, "onRemoteStream", stream);
	}
	function onICE(self, candidate) {
		self.mediaData.candidate = candidate;
		self.mediaData.candidateList.push(self.mediaData.candidate);
		doCallback(self, "onICE");
	}
	function doCallback(self, func, arg) {
		if (func in self.options.callbacks) {
			self.options.callbacks[func](self, arg);
		}
	}
	function onICEComplete(self, candidate) {
		console.log("ICE Complete");
		doCallback(self, "onICEComplete");
	}
	function onChannelError(self, e) {
		console.error("Channel Error", e);
		doCallback(self, "onError", e);
	}
	function onICESDP(self, sdp) {
		self.mediaData.SDP = self.stereoHack(sdp.sdp);
		console.log("ICE SDP");
		doCallback(self, "onICESDP");
	}
	function onAnswerSDP(self, sdp) {
		self.answer.SDP = self.stereoHack(sdp.sdp);
		console.log("ICE ANSWER SDP");
		doCallback(self, "onAnswerSDP", self.answer.SDP);
	}
	function onMessage(self, msg) {
		console.log("Message");
		doCallback(self, "onICESDP", msg);
	}
	function onRemoteStream(self, stream) {
		if (self.options.useVideo) {
			self.options.useVideo.style.display = "block";
			var iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
			if (iOS) {
				self.options.useVideo.setAttribute("playsinline", true);
			}
		}
		var element = self.options.useAudio;
		console.log("REMOTE STREAM", stream, element);
		FSRTCattachMediaStream(element, stream);
		var iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
		if (iOS) {
			self.options.useAudio.setAttribute("playsinline", true);
			self.options.useAudio.setAttribute("controls", true);
		}
		self.remoteStream = stream;
		onRemoteStreamSuccess(self, stream);
	}
	function onOfferSDP(self, sdp) {
		self.mediaData.SDP = self.stereoHack(sdp.sdp);
		console.log("Offer SDP");
		doCallback(self, "onOfferSDP");
	}
	function getMediaParams(obj) {
		var audio;
		if (obj.options.useMic && obj.options.useMic === "none") {
			console.log("Microphone Disabled");
			audio = false;
		} else if (obj.options.videoParams && obj.options.screenShare) {
			console.error("SCREEN SHARE", obj.options.videoParams);
			audio = false;
		} else {
			audio = {};
			if (obj.options.audioParams) {
				audio = obj.options.audioParams;
			}
			if (obj.options.useMic !== "any") {
				audio.deviceId = { exact: obj.options.useMic };
			}
		}
		if (obj.options.useVideo && obj.options.localVideo && !obj.options.useStream) {
			getUserMedia({
				constraints: { audio: false, video: { deviceId: obj.options.useCamera } }, localVideo: obj.options.localVideo, onsuccess: function (e) {
					obj.options.localVideoStream = e;
					console.log("local video ready");
				}, onerror: function (e) {
					console.error("local video error!");
				}
			});
		}
		var video = {};
		var bestFrameRate = obj.options.videoParams.vertoBestFrameRate;
		var minFrameRate = obj.options.videoParams.minFrameRate || 15;
		delete obj.options.videoParams.vertoBestFrameRate;
		if (obj.options.screenShare) {
			if (!obj.options.useCamera && !!navigator.mozGetUserMedia) {
				var dowin = window.confirm("Do you want to share an application window?  If not you can share an entire screen.");
				video = { width: { min: obj.options.videoParams.minWidth, max: obj.options.videoParams.maxWidth }, height: { min: obj.options.videoParams.minHeight, max: obj.options.videoParams.maxHeight }, mediaSource: dowin ? "window" : "screen" };
			} else {
				var opt = [];
				if (obj.options.useCamera) {
					opt.push({ sourceId: obj.options.useCamera });
				}
				if (bestFrameRate) {
					opt.push({ minFrameRate: bestFrameRate });
					opt.push({ maxFrameRate: bestFrameRate });
				}
				video = { mandatory: obj.options.videoParams, optional: opt };
				if (navigator.userAgent.match(/Android/i)) {
					delete video.frameRate.min;
				}
			}
		} else {
			video = { width: { min: obj.options.videoParams.minWidth, max: obj.options.videoParams.maxWidth }, height: { min: obj.options.videoParams.minHeight, max: obj.options.videoParams.maxHeight } };
			var useVideo = obj.options.useVideo;
			if (useVideo && obj.options.useCamera && obj.options.useCamera !== "none") {
				if (obj.options.useCamera !== "any") {
					video.deviceId = { exact: obj.options.useCamera };
				}
				if (bestFrameRate) {
					video.frameRate = { ideal: bestFrameRate, min: minFrameRate, max: 30 };
				}
			} else {
				console.log("Camera Disabled");
				video = false;
				useVideo = false;
			}
		}
		return { audio: audio, video: false, useVideo: false };
	}
	function FSRTCPeerConnection(options) {
		function ice_handler() {
			done = true;
			gathering = null;
			if (options.onICEComplete) {
				options.onICEComplete();
			}
			if (options.type == "offer") {
				options.onICESDP(peer.localDescription);
			} else if (!x && options.onICESDP) {
				options.onICESDP(peer.localDescription);
			}
		}
		function createOffer() {
			if (!options.onOfferSDP) {
				return;
			}
			peer.createOffer(function (sessionDescription) {
				sessionDescription.sdp = serializeSdp(sessionDescription.sdp);
				peer.setLocalDescription(sessionDescription);
				options.onOfferSDP(sessionDescription);
			}, onSdpError, options.constraints);
		}
		function createAnswer() {
			if (options.type != "answer") {
				return;
			}
			peer.setRemoteDescription(new window.RTCSessionDescription(options.offerSDP), onSdpSuccess, onSdpError);
			peer.createAnswer(function (sessionDescription) {
				sessionDescription.sdp = serializeSdp(sessionDescription.sdp);
				peer.setLocalDescription(sessionDescription);
				if (options.onAnswerSDP) {
					options.onAnswerSDP(sessionDescription);
				}
			}, onSdpError);
		}
		function setBandwidth(sdp) {
			sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "");
			sdp = sdp.replace(/a=mid:data\r\n/g, "a=mid:data\r\nb=AS:1638400\r\n");
			return sdp;
		}
		function getInteropSDP(sdp) {
			function getChars() {
				extractedChars += chars[parseInt(Math.random() * 40)] || "";
				if (extractedChars.length < 40) {
					getChars();
				}
				return extractedChars;
			}
			var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
			var extractedChars = "";
			if (options.onAnswerSDP) {
				sdp = sdp.replace(/(a=crypto:0 AES_CM_128_HMAC_SHA1_32)(.*?)(\r\n)/g, "");
			}
			var inline = getChars() + "\r\n" + (extractedChars = "");
			sdp = sdp.indexOf("a=crypto") == -1 ? sdp.replace(/c=IN/g, "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:" + inline + "c=IN") : sdp;
			return sdp;
		}
		function serializeSdp(sdp) {
			return sdp;
		}
		function openOffererChannel() {
			if (!options.onChannelMessage) {
				return;
			}
			_openOffererChannel();
		}
		function _openOffererChannel() {
			channel = peer.createDataChannel(options.channel || "RTCDataChannel", { reliable: false });
			setChannelEvents();
		}
		function setChannelEvents() {
			channel.onmessage = function (event) {
				if (options.onChannelMessage) {
					options.onChannelMessage(event);
				}
			};
			channel.onopen = function () {
				if (options.onChannelOpened) {
					options.onChannelOpened(channel);
				}
			};
			channel.onclose = function (event) {
				if (options.onChannelClosed) {
					options.onChannelClosed(event);
				}
				console.warn("WebRTC DataChannel closed", event);
			};
			channel.onerror = function (event) {
				if (options.onChannelError) {
					options.onChannelError(event);
				}
				console.error("WebRTC DataChannel error", event);
			};
		}
		function openAnswererChannel() {
			peer.ondatachannel = function (event) {
				channel = event.channel;
				channel.binaryType = "blob";
				setChannelEvents();
			};
		}
		function useless() {
			log("Error in fake:true");
		}
		function onSdpSuccess() { }
		function onSdpError(e) {
			if (options.onChannelError) {
				options.onChannelError(e);
			}
			console.error("sdp error:", e);
		}
		var gathering = false;
		var done = false;
		var config = {};
		var default_ice = [{ urls: ["stun:stun.l.google.com:19302"] }];
		if (self.options.turnServer) {
			default_ice.push(self.options.turnServer);
		}
		if (options.iceServers) {
			if (typeof options.iceServers === "boolean") {
				config.iceServers = default_ice;
			} else {
				config.iceServers = options.iceServers;
			}
		}
		config.bundlePolicy = "max-compat";
		var peer = new window.RTCPeerConnection(config);
		openOffererChannel();
		var x = 0;
		peer.onicecandidate = function (event) {
			if (done) {
				return;
			}
			if (!gathering) {
				gathering = setTimeout(ice_handler, 1e3);
			}
			if (event) {
				if (event.candidate) {
					options.onICE(event.candidate);
				}
			} else {
				done = true;
				if (gathering) {
					clearTimeout(gathering);
					gathering = null;
				}
				ice_handler();
			}
		};
		if (options.attachStream) {
			peer.addStream(options.attachStream);
		}
		if (options.attachStreams && options.attachStream.length) {
			var streams = options.attachStreams;
			for (var i = 0; i < streams.length; i++) {
				peer.addStream(streams[i]);
			}
		}
		peer.onaddstream = function (event) {
			var remoteMediaStream = event.stream;
			remoteMediaStream.oninactive = function () {
				if (options.onRemoteStreamEnded) {
					options.onRemoteStreamEnded(remoteMediaStream);
				}
			};
			if (options.onRemoteStream) {
				options.onRemoteStream(remoteMediaStream);
			}
		};
		if (options.onChannelMessage || !options.onChannelMessage) {
			createOffer();
			createAnswer();
		}
		var channel;
		return {
			addAnswerSDP: function (sdp, cbSuccess, cbError) {
				peer.setRemoteDescription(new window.RTCSessionDescription(sdp), cbSuccess ? cbSuccess : onSdpSuccess, cbError ? cbError : onSdpError);
			}, addICE: function (candidate) {
				peer.addIceCandidate(new window.RTCIceCandidate({ sdpMLineIndex: candidate.sdpMLineIndex, candidate: candidate.candidate }));
			}, peer: peer, channel: channel, sendData: function (message) {
				if (channel) {
					channel.send(message);
				}
			}, stop: function () {
				peer.close();
				if (options.attachStream) {
					if (typeof options.attachStream.stop == "function") {
						options.attachStream.stop();
					} else {
						options.attachStream.active = false;
					}
				}
			}
		};
	}
	function activateLocalVideo(el, stream) {
		el.srcObject = stream;
		el.style.display = "block";
	}
	function deactivateLocalVideo(el) {
		el.srcObject = null;
		el.style.display = "none";
	}
	function getUserMedia(options) {
		function streaming(stream) {
			if (options.localVideo) {
				activateLocalVideo(options.localVideo, stream);
			}
			if (options.onsuccess) {
				options.onsuccess(stream);
			}
			media = stream;
		}
		var n = navigator;
		var media;
		n.getMedia = n.getUserMedia;
		n.getMedia(options.constraints || { audio: true, video: video_constraints }, streaming, options.onerror || function (e) {
			console.error(e);
		});
		return media;
	}
	var $ = jQuery;
	$.FSRTC = function (options) {
		this.options = $.extend({ useVideo: null, useStereo: false, userData: null, localVideo: null, screenShare: false, useCamera: "any", iceServers: false, videoParams: {}, audioParams: {}, callbacks: { onICEComplete: function () { }, onICE: function () { }, onOfferSDP: function () { } }, useStream: null }, options);
		this.audioEnabled = true;
		this.videoEnabled = true;
		this.mediaData = { SDP: null, profile: {}, candidateList: [] };
		this.constraints = { offerToReceiveAudio: this.options.useSpeak === "none" ? false : true, offerToReceiveVideo: this.options.useVideo ? true : false };
		if (self.options.useVideo) {
			self.options.useVideo.style.display = "none";
		}
		setCompat();
		checkCompat();
	};
	$.FSRTC.validRes = [];
	$.FSRTC.prototype.useVideo = function (obj, local) {
		var self = this;
		if (obj) {
			self.options.useVideo = obj;
			self.options.localVideo = local;
			self.constraints.offerToReceiveVideo = true;
		} else {
			self.options.useVideo = null;
			self.options.localVideo = null;
			self.constraints.offerToReceiveVideo = false;
		}
		if (self.options.useVideo) {
			self.options.useVideo.style.display = "none";
		}
	};
	$.FSRTC.prototype.useStereo = function (on) {
		var self = this;
		self.options.useStereo = on;
	};
	$.FSRTC.prototype.stereoHack = function (sdp) {
		var self = this;
		if (!self.options.useStereo) {
			return sdp;
		}
		var sdpLines = sdp.split("\r\n");
		var opusIndex = findLine(sdpLines, "a=rtpmap", "opus/48000");
		var opusPayload;
		if (!opusIndex) {
			return sdp;
		} else {
			opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
		}
		var fmtpLineIndex = findLine(sdpLines, "a=fmtp:" + opusPayload.toString());
		if (fmtpLineIndex === null) {
			sdpLines[opusIndex] = sdpLines[opusIndex] + "\r\na=fmtp:" + opusPayload.toString() + " stereo=1; sprop-stereo=1";
		} else {
			sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat("; stereo=1; sprop-stereo=1");
		}
		sdp = sdpLines.join("\r\n");
		return sdp;
	};
	FSRTCattachMediaStream = function (element, stream) {
		if (typeof element.srcObject === "undefined") {
			console.error("Error attaching stream to element.");
		} else {
			element.srcObject = stream;
		}
	};
	$.FSRTC.prototype.answer = function (sdp, onSuccess, onError) {
		this.peer.addAnswerSDP({ type: "answer", sdp: sdp }, onSuccess, onError);
	};
	$.FSRTC.prototype.stopPeer = function () {
		if (self.peer) {
			console.log("stopping peer");
			self.peer.stop();
		}
	};
	$.FSRTC.prototype.stop = function () {
		var self = this;
		if (self.options.useVideo) {
			self.options.useVideo.style.display = "none";
			self.options.useVideo.src = "";
		}
		if (self.localStream && !self.options.useStream) {
			if (typeof self.localStream.stop == "function") {
				self.localStream.stop();
			} else if (self.localStream.active) {
				var tracks = self.localStream.getTracks();
				console.log(tracks);
				tracks.forEach(function (track, index) {
					console.log(track);
					track.stop();
				});
			}
			self.localStream = null;
		}
		if (self.options.localVideo) {
			deactivateLocalVideo(self.options.localVideo);
		}
		if (self.options.localVideoStream && !self.options.useStream) {
			if (typeof self.options.localVideoStream.stop == "function") {
				self.options.localVideoStream.stop();
			} else if (self.options.localVideoStream.active) {
				var tracks = self.options.localVideoStream.getTracks();
				console.log(tracks);
				tracks.forEach(function (track, index) {
					console.log(track);
					track.stop();
				});
			}
		}
		if (self.peer) {
			console.log("stopping peer");
			self.peer.stop();
		}
	};
	$.FSRTC.prototype.getMute = function () {
		var self = this;
		return self.audioEnabled;
	};
	$.FSRTC.prototype.setMute = function (what) {
		var self = this;
		if (!self.localStream) {
			return false;
		}
		var audioTracks = self.localStream.getAudioTracks();
		var i = 0;
		for (var len = audioTracks.length; i < len; i++) {
			switch (what) {
				case "on":
					audioTracks[i].enabled = true;
					break;
				case "off":
					audioTracks[i].enabled = false;
					break;
				case "toggle":
					audioTracks[i].enabled = !audioTracks[i].enabled;
				default:
					break;
			}
			self.audioEnabled = audioTracks[i].enabled;
		}
		return !self.audioEnabled;
	};
	$.FSRTC.prototype.getVideoMute = function () {
		var self = this;
		return self.videoEnabled;
	};
	$.FSRTC.prototype.setVideoMute = function (what) {
		var self = this;
		if (!self.localStream) {
			return false;
		}
		var videoTracks = self.localStream.getVideoTracks();
		var i = 0;
		for (var len = videoTracks.length; i < len; i++) {
			switch (what) {
				case "on":
					videoTracks[i].enabled = true;
					break;
				case "off":
					videoTracks[i].enabled = false;
					break;
				case "toggle":
					videoTracks[i].enabled = !videoTracks[i].enabled;
				default:
					break;
			}
			self.videoEnabled = videoTracks[i].enabled;
		}
		return !self.videoEnabled;
	};
	$.FSRTC.prototype.createAnswer = function (params) {
		function onSuccess(stream) {
			self.localStream = stream;
			self.peer = FSRTCPeerConnection({
				type: self.type, attachStream: self.localStream, onICE: function (candidate) {
					return onICE(self, candidate);
				}, onICEComplete: function () {
					return onICEComplete(self);
				}, onRemoteStream: function (stream) {
					return onRemoteStream(self, stream);
				}, onICESDP: function (sdp) {
					return onICESDP(self, sdp);
				}, onChannelError: function (e) {
					return onChannelError(self, e);
				}, constraints: self.constraints, iceServers: self.options.iceServers, offerSDP: { type: "offer", sdp: self.remoteSDP }, turnServer: self.options.turnServer
			});
			onStreamSuccess(self, stream);
		}
		function onError(e) {
			onStreamError(self, e);
		}
		var self = this;
		self.type = "answer";
		self.remoteSDP = params.sdp;
		console.debug("inbound sdp: ", params.sdp);
		var mediaParams = getMediaParams(self);
		console.log("Audio constraints", mediaParams.audio);
		console.log("Video constraints", mediaParams.video);
		if (self.options.useVideo && self.options.localVideo && !self.options.useStream) {
			getUserMedia({
				constraints: { audio: false, video: { deviceId: params.useCamera } }, localVideo: self.options.localVideo, onsuccess: function (e) {
					self.options.localVideoStream = e;
					console.log("local video ready");
				}, onerror: function (e) {
					console.error("local video error!");
				}
			});
		}
		if (self.options.useStream) {
			if (self.options.useVideo) {
				self.options.localVideoStream = self.options.useStream;
				if (self.options.localVideo) {
					activateLocalVideo(self.options.localVideo, self.options.useStream);
				}
			}
			onSuccess(self.options.useStream);
		} else {
			getUserMedia({ constraints: { audio: mediaParams.audio, video: mediaParams.video }, video: mediaParams.useVideo, onsuccess: onSuccess, onerror: onError });
		}
	};
	$.FSRTC.prototype.call = function (profile) {
		function onSuccess(stream) {
			self.localStream = stream;
			if (screen) {
				self.constraints.offerToReceiveVideo = false;
				self.constraints.offerToReceiveAudio = false;
				self.constraints.offerToSendAudio = false;
			}
			self.peer = FSRTCPeerConnection({
				type: self.type, attachStream: self.localStream, onICE: function (candidate) {
					return onICE(self, candidate);
				}, onICEComplete: function () {
					return onICEComplete(self);
				}, onRemoteStream: screen ? function (stream) { } : function (stream) {
					return onRemoteStream(self, stream);
				}, onOfferSDP: function (sdp) {
					return onOfferSDP(self, sdp);
				}, onICESDP: function (sdp) {
					return onICESDP(self, sdp);
				}, onChannelError: function (e) {
					return onChannelError(self, e);
				}, constraints: self.constraints, iceServers: self.options.iceServers, turnServer: self.options.turnServer
			});
			onStreamSuccess(self, stream);
		}
		function onError(e) {
			onStreamError(self, e);
		}
		checkCompat();
		var self = this;
		var screen = false;
		self.type = "offer";
		if (self.options.videoParams && self.options.screenShare) {
			screen = true;
		}
		var mediaParams = getMediaParams(self);
		console.log("Audio constraints", mediaParams.audio);
		console.log("Video constraints", mediaParams.video);
		if (self.options.useStream) {
			if (self.options.useVideo) {
				self.options.localVideoStream = self.options.useStream;
				if (self.options.localVideo) {
					activateLocalVideo(self.options.localVideo, self.options.useStream);
				}
			}
			onSuccess(self.options.useStream);
		} else if (mediaParams.audio || mediaParams.video) {
			getUserMedia({ constraints: { audio: mediaParams.audio, video: mediaParams.video }, video: mediaParams.useVideo, onsuccess: onSuccess, onerror: onError });
		} else {
			onSuccess(null);
		}
	};
	var video_constraints = {};
	$.FSRTC.resSupported = function (w, h) {
		for (var i in $.FSRTC.validRes) {
			if ($.FSRTC.validRes[i][0] == w && $.FSRTC.validRes[i][1] == h) {
				return true;
			}
		}
		return false;
	};
	$.FSRTC.bestResSupported = function () {
		var w = 0;
		var h = 0;
		for (var i in $.FSRTC.validRes) {
			if ($.FSRTC.validRes[i][0] >= w && $.FSRTC.validRes[i][1] >= h) {
				w = $.FSRTC.validRes[i][0];
				h = $.FSRTC.validRes[i][1];
			}
		}
		return [w, h];
	};
	var resList = [[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [1280, 720], [1920, 1080]];
	var resI = 0;
	var ttl = 0;
	var checkRes = function (cam, func) {
		if (resI >= resList.length) {
			var res = { validRes: $.FSRTC.validRes, bestResSupported: $.FSRTC.bestResSupported() };
			localStorage.setItem("res_" + cam, $.toJSON(res));
			if (func) {
				return func(res);
			}
			return;
		}
		w = resList[resI][0];
		h = resList[resI][1];
		resI++;
		var video = { width: { exact: w }, height: { exact: h } };
		if (cam !== "any") {
			video.deviceId = { exact: cam };
		}
		getUserMedia({
			constraints: { audio: ttl++ == 0, video: video }, onsuccess: function (e) {
				e.getTracks().forEach(function (track) {
					track.stop();
				});
				console.info(w + "x" + h + " supported.");
				$.FSRTC.validRes.push([w, h]);
				checkRes(cam, func);
			}, onerror: function (e) {
				console.warn(w + "x" + h + " not supported.");
				checkRes(cam, func);
			}
		});
	};
	$.FSRTC.getValidRes = function (cam, func) {
		var used = [];
		var cached = localStorage.getItem("res_" + cam);
		if (cached) {
			var cache = $.parseJSON(cached);
			if (cache) {
				$.FSRTC.validRes = cache.validRes;
				console.log("CACHED RES FOR CAM " + cam, cache);
			} else {
				console.error("INVALID CACHE");
			}
			if (func) {
				return func(cache);
			} else {
				return null;
			}
		}
		$.FSRTC.validRes = [];
		resI = 0;
		checkRes(cam, func);
	};
	$.FSRTC.checkPerms = function (runtime, check_audio, check_video) {
		getUserMedia({
			constraints: { audio: check_audio, video: check_video }, onsuccess: function (e) {
				e.getTracks().forEach(function (track) {
					track.stop();
				});
				console.info("media perm init complete");
				if (runtime) {
					setTimeout(runtime, 100, true);
				}
			}, onerror: function (e) {
				if (check_video && check_audio) {
					console.error("error, retesting with audio params only");
					return $.FSRTC.checkPerms(runtime, check_audio, false);
				}
				console.error("media perm init error");
				if (runtime) {
					runtime(false);
				}
			}
		});
	};
}());
(function () {
	var $ = jQuery;
	$.JsonRpcClient = function (options) {
		var self = this;
		this.options = $.extend({
			ajaxUrl: null, socketUrl: null, onmessage: null, login: null, passwd: null, sessid: null, loginParams: null, userVariables: null, getSocket: function (onmessage_cb) {
				return self._getSocket(onmessage_cb);
			}
		}, options);
		self.ws_cnt = 0;
		this.wsOnMessage = function (event) {
			self._wsOnMessage(event);
		};
	};
	$.JsonRpcClient.prototype._ws_socket = null;
	$.JsonRpcClient.prototype._ws_callbacks = {};
	$.JsonRpcClient.prototype._current_id = 1;
	$.JsonRpcClient.prototype.speedTest = function (bytes, cb) {
		var socket = this.options.getSocket(this.wsOnMessage);
		if (socket !== null) {
			this.speedCB = cb;
			this.speedBytes = bytes;
			socket.send("#SPU " + bytes);
			var loops = bytes / 1024;
			var rem = bytes % 1024;
			var i;
			var data = new Array(1024).join(".");
			for (i = 0; i < loops; i++) {
				socket.send("#SPB " + data);
			}
			if (rem) {
				socket.send("#SPB " + data);
			}
			socket.send("#SPE");
		}
	};
	$.JsonRpcClient.prototype.call = function (method, params, success_cb, error_cb) {
		if (!params) {
			params = {};
		}
		if (this.options.sessid) {
			params.sessid = this.options.sessid;
		}
		var request = { jsonrpc: "2.0", method: method, params: params, id: this._current_id++ };
		if (!success_cb) {
			success_cb = function (e) {
				console.log("Success: ", e);
			};
		}
		if (!error_cb) {
			error_cb = function (e) {
				console.log("Error: ", e);
			};
		}
		var socket = this.options.getSocket(this.wsOnMessage);
		if (socket !== null) {
			this._wsCall(socket, request, success_cb, error_cb);
			return;
		}
		if (this.options.ajaxUrl === null) {
			throw "$.JsonRpcClient.call used with no websocket and no http endpoint.";
		}
		$.ajax({
			type: "POST", url: this.options.ajaxUrl, data: $.toJSON(request), dataType: "json", cache: false, success: function (data) {
				if ("error" in data) {
					error_cb(data.error, this);
				}
				success_cb(data.result, this);
			}, error: function (jqXHR, textStatus, errorThrown) {
				try {
					var response = $.parseJSON(jqXHR.responseText);
					if ("console" in window) {
						console.log(response);
					}
					error_cb(response.error, this);
				} catch (err) {
					error_cb({ error: jqXHR.responseText }, this);
				}
			}
		});
	};
	$.JsonRpcClient.prototype.notify = function (method, params) {
		if (this.options.sessid) {
			params.sessid = this.options.sessid;
		}
		var request = { jsonrpc: "2.0", method: method, params: params };
		var socket = this.options.getSocket(this.wsOnMessage);
		if (socket !== null) {
			this._wsCall(socket, request);
			return;
		}
		if (this.options.ajaxUrl === null) {
			throw "$.JsonRpcClient.notify used with no websocket and no http endpoint.";
		}
		$.ajax({ type: "POST", url: this.options.ajaxUrl, data: $.toJSON(request), dataType: "json", cache: false });
	};
	$.JsonRpcClient.prototype.batch = function (callback, all_done_cb, error_cb) {
		var batch = new $.JsonRpcClient._batchObject(this, all_done_cb, error_cb);
		callback(batch);
		batch._execute();
	};
	$.JsonRpcClient.prototype.socketReady = function () {
		if (this._ws_socket === null || this._ws_socket.readyState > 1) {
			return false;
		}
		return true;
	};
	$.JsonRpcClient.prototype.closeSocket = function () {
		var self = this;
		if (self.socketReady()) {
			self._ws_socket.onclose = function (w) {
				console.log("Closing Socket");
			};
			self._ws_socket.close();
		}
	};
	$.JsonRpcClient.prototype.loginData = function (params) {
		var self = this;
		self.options.login = params.login;
		self.options.passwd = params.passwd;
		self.options.loginParams = params.loginParams;
		self.options.userVariables = params.userVariables;
	};
	$.JsonRpcClient.prototype.connectSocket = function (onmessage_cb) {
		var self = this;
		if (self.to) {
			clearTimeout(self.to);
		}
		if (!self.socketReady()) {
			self.authing = false;
			if (self._ws_socket) {
				delete self._ws_socket;
			}
			self._ws_socket = new WebSocket(self.options.socketUrl);
			if (self._ws_socket) {
				self._ws_socket.onmessage = onmessage_cb;
				self._ws_socket.onclose = function (w) {
					if (!self.ws_sleep) {
						self.ws_sleep = 1e3;
					}
					if (self.options.onWSClose) {
						self.options.onWSClose(self);
					}
					if (self.ws_cnt > 10 && self.options.wsFallbackURL) {
						self.options.socketUrl = self.options.wsFallbackURL;
					}
					console.error("Websocket Lost " + self.ws_cnt + " sleep: " + self.ws_sleep + "msec");
					self.to = setTimeout(function () {
						console.log("Attempting Reconnection....");
						self.connectSocket(onmessage_cb);
					}, self.ws_sleep);
					self.ws_cnt++;
					if (self.ws_sleep < 3e3 && self.ws_cnt % 10 === 0) {
						self.ws_sleep += 1e3;
					}
				};
				self._ws_socket.onopen = function () {
					if (self.to) {
						clearTimeout(self.to);
					}
					self.ws_sleep = 1e3;
					self.ws_cnt = 0;
					if (self.options.onWSConnect) {
						self.options.onWSConnect(self);
					}
					var req;
					while (req = $.JsonRpcClient.q.pop()) {
						self._ws_socket.send(req);
					}
				};
			}
		}
		if (self._ws_socket) {
			return true;
		} else {
			return false;
		}
	};
	$.JsonRpcClient.prototype.stopRetrying = function () {
		if (self.to) {
			clearTimeout(self.to);
		}
	};
	$.JsonRpcClient.prototype._getSocket = function (onmessage_cb) {
		if (this.options.socketUrl === null || !("WebSocket" in window)) {
			return null;
		}
		this.connectSocket(onmessage_cb);
		return this._ws_socket;
	};
	$.JsonRpcClient.q = [];
	$.JsonRpcClient.prototype._wsCall = function (socket, request, success_cb, error_cb) {
		var request_json = $.toJSON(request);
		if (socket.readyState < 1) {
			self = this;
			$.JsonRpcClient.q.push(request_json);
		} else {
			socket.send(request_json);
		}
		if ("id" in request && typeof success_cb !== "undefined") {
			this._ws_callbacks[request.id] = { request: request_json, request_obj: request, success_cb: success_cb, error_cb: error_cb };
		}
	};
	$.JsonRpcClient.prototype._wsOnMessage = function (event) {
		var response;
		if (event.data[0] == "#" && event.data[1] == "S" && event.data[2] == "P") {
			if (event.data[3] == "U") {
				this.up_dur = parseInt(event.data.substring(4));
			} else if (this.speedCB && event.data[3] == "D") {
				this.down_dur = parseInt(event.data.substring(4));
				var up_kps = (this.speedBytes * 8 / (this.up_dur / 1e3) / 1024).toFixed(0);
				var down_kps = (this.speedBytes * 8 / (this.down_dur / 1e3) / 1024).toFixed(0);
				console.info("Speed Test: Up: " + up_kps + " Down: " + down_kps);
				var cb = this.speedCB;
				this.speedCB = null;
				cb(event, { upDur: this.up_dur, downDur: this.down_dur, upKPS: up_kps, downKPS: down_kps });
			}
			return;
		}
		try {
			response = $.parseJSON(event.data);
			if (typeof response === "object" && "jsonrpc" in response && response.jsonrpc === "2.0") {
				if ("result" in response && this._ws_callbacks[response.id]) {
					var success_cb = this._ws_callbacks[response.id].success_cb;
					delete this._ws_callbacks[response.id];
					success_cb(response.result, this);
					return;
				} else if ("error" in response && this._ws_callbacks[response.id]) {
					var error_cb = this._ws_callbacks[response.id].error_cb;
					var orig_req = this._ws_callbacks[response.id].request;
					if (!self.authing && response.error.code == -32e3 && self.options.login && self.options.passwd) {
						self.authing = true;
						this.call("login", { login: self.options.login, passwd: self.options.passwd, loginParams: self.options.loginParams, userVariables: self.options.userVariables }, this._ws_callbacks[response.id].request_obj.method == "login" ? function (e) {
							self.authing = false;
							console.log("logged in");
							delete self._ws_callbacks[response.id];
							if (self.options.onWSLogin) {
								self.options.onWSLogin(true, self);
							}
						} : function (e) {
							self.authing = false;
							console.log("logged in, resending request id: " + response.id);
							var socket = self.options.getSocket(self.wsOnMessage);
							if (socket !== null) {
								socket.send(orig_req);
							}
							if (self.options.onWSLogin) {
								self.options.onWSLogin(true, self);
							}
						}, function (e) {
							console.log("error logging in, request id:", response.id);
							delete self._ws_callbacks[response.id];
							error_cb(response.error, this);
							if (self.options.onWSLogin) {
								self.options.onWSLogin(false, self);
							}
						});
						return;
					}
					delete this._ws_callbacks[response.id];
					error_cb(response.error, this);
					return;
				}
			}
		} catch (err) {
			console.log("ERROR: " + err);
			return;
		}
		if (typeof this.options.onmessage === "function") {
			event.eventData = response;
			if (!event.eventData) {
				event.eventData = {};
			}
			var reply = this.options.onmessage(event);
			if (reply && typeof reply === "object" && event.eventData.id) {
				var msg = { jsonrpc: "2.0", id: event.eventData.id, result: reply };
				var socket = self.options.getSocket(self.wsOnMessage);
				if (socket !== null) {
					socket.send($.toJSON(msg));
				}
			}
		}
	};
	$.JsonRpcClient._batchObject = function (jsonrpcclient, all_done_cb, error_cb) {
		this._requests = [];
		this.jsonrpcclient = jsonrpcclient;
		this.all_done_cb = all_done_cb;
		this.error_cb = typeof error_cb === "function" ? error_cb : function () { };
	};
	$.JsonRpcClient._batchObject.prototype.call = function (method, params, success_cb, error_cb) {
		if (!params) {
			params = {};
		}
		if (this.options.sessid) {
			params.sessid = this.options.sessid;
		}
		if (!success_cb) {
			success_cb = function (e) {
				console.log("Success: ", e);
			};
		}
		if (!error_cb) {
			error_cb = function (e) {
				console.log("Error: ", e);
			};
		}
		this._requests.push({ request: { jsonrpc: "2.0", method: method, params: params, id: this.jsonrpcclient._current_id++ }, success_cb: success_cb, error_cb: error_cb });
	};
	$.JsonRpcClient._batchObject.prototype.notify = function (method, params) {
		if (this.options.sessid) {
			params.sessid = this.options.sessid;
		}
		this._requests.push({ request: { jsonrpc: "2.0", method: method, params: params } });
	};
	$.JsonRpcClient._batchObject.prototype._execute = function () {
		var self = this;
		if (this._requests.length === 0) {
			return;
		}
		var batch_request = [];
		var handlers = {};
		var i = 0;
		var call;
		var success_cb;
		var error_cb;
		var socket = self.jsonrpcclient.options.getSocket(self.jsonrpcclient.wsOnMessage);
		if (socket !== null) {
			for (i = 0; i < this._requests.length; i++) {
				call = this._requests[i];
				success_cb = "success_cb" in call ? call.success_cb : undefined;
				error_cb = "error_cb" in call ? call.error_cb : undefined;
				self.jsonrpcclient._wsCall(socket, call.request, success_cb, error_cb);
			}
			if (typeof all_done_cb === "function") {
				all_done_cb(result);
			}
			return;
		}
		for (i = 0; i < this._requests.length; i++) {
			call = this._requests[i];
			batch_request.push(call.request);
			if ("id" in call.request) {
				handlers[call.request.id] = { success_cb: call.success_cb, error_cb: call.error_cb };
			}
		}
		success_cb = function (data) {
			self._batchCb(data, handlers, self.all_done_cb);
		};
		if (self.jsonrpcclient.options.ajaxUrl === null) {
			throw "$.JsonRpcClient.batch used with no websocket and no http endpoint.";
		}
		$.ajax({
			url: self.jsonrpcclient.options.ajaxUrl, data: $.toJSON(batch_request), dataType: "json", cache: false, type: "POST", error: function (jqXHR, textStatus, errorThrown) {
				self.error_cb(jqXHR, textStatus, errorThrown);
			}, success: success_cb
		});
	};
	$.JsonRpcClient._batchObject.prototype._batchCb = function (result, handlers, all_done_cb) {
		for (var i = 0; i < result.length; i++) {
			var response = result[i];
			if ("error" in response) {
				if (response.id === null || !(response.id in handlers)) {
					if ("console" in window) {
						console.log(response);
					}
				} else {
					handlers[response.id].error_cb(response.error, this);
				}
			} else if (!(response.id in handlers) && "console" in window) {
				console.log(response);
			} else {
				handlers[response.id].success_cb(response.result, this);
			}
		}
		if (typeof all_done_cb === "function") {
			all_done_cb(result);
		}
	};
}());
(function () {
	function do_sub(verto, channel, obj) { }
	function drop_bad(verto, channel) {
		console.error("drop unauthorized channel: " + channel);
		delete verto.eventSUBS[channel];
	}
	function mark_ready(verto, channel) {
		for (var j in verto.eventSUBS[channel]) {
			verto.eventSUBS[channel][j].ready = true;
			console.log("subscribed to channel: " + channel);
			if (verto.eventSUBS[channel][j].readyHandler) {
				verto.eventSUBS[channel][j].readyHandler(verto, channel);
			}
		}
	}
	function do_subscribe(verto, channel, subChannels, sparams) {
		var params = sparams || {};
		var local = params.local;
		var obj = { eventChannel: channel, userData: params.userData, handler: params.handler, ready: false, readyHandler: params.readyHandler, serno: SERNO++ };
		var isnew = false;
		if (!verto.eventSUBS[channel]) {
			verto.eventSUBS[channel] = [];
			subChannels.push(channel);
			isnew = true;
		}
		verto.eventSUBS[channel].push(obj);
		if (local) {
			obj.ready = true;
			obj.local = true;
		}
		if (!isnew && verto.eventSUBS[channel][0].ready) {
			obj.ready = true;
			if (obj.readyHandler) {
				obj.readyHandler(verto, channel);
			}
		}
		return { serno: obj.serno, eventChannel: channel };
	}
	function createMainModeratorMethods() {
		$.verto.conf.prototype.listVideoLayouts = function () {
			this.modCommand("list-videoLayouts", null, null);
		};
		$.verto.conf.prototype.play = function (file) {
			this.modCommand("play", null, file);
		};
		$.verto.conf.prototype.stop = function () {
			this.modCommand("stop", null, "all");
		};
		$.verto.conf.prototype.deaf = function (memberID) {
			this.modCommand("deaf", parseInt(memberID));
		};
		$.verto.conf.prototype.undeaf = function (memberID) {
			this.modCommand("undeaf", parseInt(memberID));
		};
		$.verto.conf.prototype.record = function (file) {
			this.modCommand("recording", null, ["start", file]);
		};
		$.verto.conf.prototype.stopRecord = function () {
			this.modCommand("recording", null, ["stop", "all"]);
		};
		$.verto.conf.prototype.snapshot = function (file) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			this.modCommand("vid-write-png", null, file);
		};
		$.verto.conf.prototype.setVideoLayout = function (layout, canvasID) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			if (canvasID) {
				this.modCommand("vid-layout", null, [layout, canvasID]);
			} else {
				this.modCommand("vid-layout", null, layout);
			}
		};
		$.verto.conf.prototype.kick = function (memberID) {
			this.modCommand("kick", parseInt(memberID));
		};
		$.verto.conf.prototype.muteMic = function (memberID) {
			this.modCommand("tmute", parseInt(memberID));
		};
		$.verto.conf.prototype.muteVideo = function (memberID) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			this.modCommand("tvmute", parseInt(memberID));
		};
		$.verto.conf.prototype.presenter = function (memberID) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			this.modCommand("vid-res-id", parseInt(memberID), "presenter");
		};
		$.verto.conf.prototype.videoFloor = function (memberID) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			this.modCommand("vid-floor", parseInt(memberID), "force");
		};
		$.verto.conf.prototype.banner = function (memberID, text) {
			if (!this.params.hasVid) {
				throw "Conference has no video";
			}
			this.modCommand("vid-banner", parseInt(memberID), escape(text));
		};
		$.verto.conf.prototype.volumeDown = function (memberID) {
			this.modCommand("volume_out", parseInt(memberID), "down");
		};
		$.verto.conf.prototype.volumeUp = function (memberID) {
			this.modCommand("volume_out", parseInt(memberID), "up");
		};
		$.verto.conf.prototype.gainDown = function (memberID) {
			this.modCommand("volume_in", parseInt(memberID), "down");
		};
		$.verto.conf.prototype.gainUp = function (memberID) {
			this.modCommand("volume_in", parseInt(memberID), "up");
		};
		$.verto.conf.prototype.transfer = function (memberID, exten) {
			this.modCommand("transfer", parseInt(memberID), exten);
		};
		$.verto.conf.prototype.sendChat = function (message, type) {
			var conf = this;
			conf.verto.rpcClient.call("verto.broadcast", { eventChannel: conf.params.laData.chatChannel, data: { action: "send", message: message, type: type } });
		};
	}
	function checkStateChange(oldS, newS) {
		if (newS == $.verto.enum.state.purge || $.verto.enum.states[oldS.name][newS.name]) {
			return true;
		}
		return false;
	}
	function find_name(id) {
		for (var i in $.verto.audioOutDevices) {
			var source = $.verto.audioOutDevices[i];
			if (source.id === id) {
				return source.label;
			}
		}
		return id;
	}
	var $ = jQuery;
	var sources = [];
	var generateGUID = typeof window.crypto !== "undefined" && typeof window.crypto.getRandomValues !== "undefined" ? function () {
		var buf = new Uint16Array(8);
		window.crypto.getRandomValues(buf);
		var S4 = function (num) {
			var ret = num.toString(16);
			while (ret.length < 4) {
				ret = "0" + ret;
			}
			return ret;
		};
		return S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]);
	} : function () {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0;
			var v = c == "x" ? r : r & 3 | 8;
			return v.toString(16);
		});
	};
	$.verto = function (options, callbacks) {
		var verto = this;
		$.verto.saved.push(verto);
		verto.options = $.extend({ login: null, passwd: null, socketUrl: null, tag: null, localTag: null, videoParams: {}, audioParams: {}, loginParams: {}, deviceParams: { onResCheck: null }, userVariables: {}, iceServers: false, ringSleep: 6e3, sessid: null, useStream: null }, options);
		if (verto.options.deviceParams.useCamera) {
			$.FSRTC.getValidRes(verto.options.deviceParams.useCamera, verto.options.deviceParams.onResCheck);
		}
		if (!verto.options.deviceParams.useMic) {
			verto.options.deviceParams.useMic = "any";
		}
		if (!verto.options.deviceParams.useSpeak) {
			verto.options.deviceParams.useSpeak = "any";
		}
		if (verto.options.sessid) {
			verto.sessid = verto.options.sessid;
		} else {
			verto.sessid = localStorage.getItem("verto_session_uuid") || generateGUID();
			localStorage.setItem("verto_session_uuid", verto.sessid);
		}
		verto.dialogs = {};
		verto.callbacks = callbacks || {};
		verto.eventSUBS = {};
		verto.rpcClient = new $.JsonRpcClient({
			login: verto.options.login, passwd: verto.options.passwd, socketUrl: verto.options.socketUrl, wsFallbackURL: verto.options.wsFallbackURL, turnServer: verto.options.turnServer, loginParams: verto.options.loginParams, userVariables: verto.options.userVariables, sessid: verto.sessid, onmessage: function (e) {
				return verto.handleMessage(e.eventData);
			}, onWSConnect: function (o) {
				o.call("login", {});
			}, onWSLogin: function (success) {
				if (verto.callbacks.onWSLogin) {
					verto.callbacks.onWSLogin(verto, success);
				}
			}, onWSClose: function (success) {
				if (verto.callbacks.onWSClose) {
					verto.callbacks.onWSClose(verto, success);
				}
				verto.purge();
			}
		});
		var tag = verto.options.tag;
		if (typeof tag === "function") {
			tag = tag();
		}
		if (verto.options.ringFile && verto.options.tag) {
			verto.ringer = $("#" + tag);
		}
		verto.rpcClient.call("login", {});
	};
	$.verto.prototype.deviceParams = function (obj) {
		var verto = this;
		for (var i in obj) {
			verto.options.deviceParams[i] = obj[i];
		}
		if (obj.useCamera) {
			$.FSRTC.getValidRes(verto.options.deviceParams.useCamera, obj ? obj.onResCheck : undefined);
		}
	};
	$.verto.prototype.videoParams = function (obj) {
		var verto = this;
		for (var i in obj) {
			verto.options.videoParams[i] = obj[i];
		}
	};
	$.verto.prototype.iceServers = function (obj) {
		var verto = this;
		verto.options.iceServers = obj;
	};
	$.verto.prototype.loginData = function (params) {
		var verto = this;
		verto.options.login = params.login;
		verto.options.passwd = params.passwd;
		verto.rpcClient.loginData(params);
	};
	$.verto.prototype.logout = function (msg) {
		var verto = this;
		verto.rpcClient.closeSocket();
		if (verto.callbacks.onWSClose) {
			verto.callbacks.onWSClose(verto, false);
		}
		verto.purge();
	};
	$.verto.prototype.login = function (msg) {
		var verto = this;
		verto.logout();
		verto.rpcClient.call("login", {});
	};
	$.verto.prototype.message = function (msg) {
		var verto = this;
		var err = 0;
		if (!msg.to) {
			console.error("Missing To");
			err++;
		}
		if (!msg.body) {
			console.error("Missing Body");
			err++;
		}
		if (err) {
			return false;
		}
		verto.sendMethod("verto.info", { msg: msg });
		return true;
	};
	$.verto.prototype.processReply = function (method, success, e) {
		var verto = this;
		var i;
		switch (method) {
			case "verto.subscribe":
				for (i in e.unauthorizedChannels) {
					drop_bad(verto, e.unauthorizedChannels[i]);
				}
				for (i in e.subscribedChannels) {
					mark_ready(verto, e.subscribedChannels[i]);
				}
				break;
			case "verto.unsubscribe":
				break;
		}
	};
	$.verto.prototype.sendMethod = function (method, params) {
		var verto = this;
		verto.rpcClient.call(method, params, function (e) {
			verto.processReply(method, true, e);
		}, function (e) {
			verto.processReply(method, false, e);
		});
	};
	var SERNO = 1;
	$.verto.prototype.subscribe = function (channel, sparams) {
		var verto = this;
		var r = [];
		var subChannels = [];
		var params = sparams || {};
		if (typeof channel === "string") {
			r.push(do_subscribe(verto, channel, subChannels, params));
		} else {
			for (var i in channel) {
				r.push(do_subscribe(verto, channel, subChannels, params));
			}
		}
		if (subChannels.length) {
			verto.sendMethod("verto.subscribe", { eventChannel: subChannels.length == 1 ? subChannels[0] : subChannels, subParams: params.subParams });
		}
		return r;
	};
	$.verto.prototype.unsubscribe = function (handle) {
		var verto = this;
		var i;
		if (!handle) {
			for (i in verto.eventSUBS) {
				if (verto.eventSUBS[i]) {
					verto.unsubscribe(verto.eventSUBS[i]);
				}
			}
		} else {
			var unsubChannels = {};
			var sendChannels = [];
			var channel;
			if (typeof handle == "string") {
				delete verto.eventSUBS[handle];
				unsubChannels[handle]++;
			} else {
				for (i in handle) {
					if (typeof handle[i] == "string") {
						channel = handle[i];
						delete verto.eventSUBS[channel];
						unsubChannels[channel]++;
					} else {
						var repl = [];
						channel = handle[i].eventChannel;
						for (var j in verto.eventSUBS[channel]) {
							if (verto.eventSUBS[channel][j].serno == handle[i].serno) { } else {
								repl.push(verto.eventSUBS[channel][j]);
							}
						}
						verto.eventSUBS[channel] = repl;
						if (verto.eventSUBS[channel].length === 0) {
							delete verto.eventSUBS[channel];
							unsubChannels[channel]++;
						}
					}
				}
			}
			for (var u in unsubChannels) {
				console.log("Sending Unsubscribe for: ", u);
				sendChannels.push(u);
			}
			if (sendChannels.length) {
				verto.sendMethod("verto.unsubscribe", { eventChannel: sendChannels.length == 1 ? sendChannels[0] : sendChannels });
			}
		}
	};
	$.verto.prototype.broadcast = function (channel, params) {
		var verto = this;
		var msg = { eventChannel: channel, data: {} };
		for (var i in params) {
			msg.data[i] = params[i];
		}
		verto.sendMethod("verto.broadcast", msg);
	};
	$.verto.prototype.purge = function (callID) {
		var verto = this;
		var x = 0;
		var i;
		for (i in verto.dialogs) {
			if (!x) {
				console.log("purging dialogs");
			}
			x++;
			verto.dialogs[i].setState($.verto.enum.state.purge);
		}
		for (i in verto.eventSUBS) {
			if (verto.eventSUBS[i]) {
				console.log("purging subscription: " + i);
				delete verto.eventSUBS[i];
			}
		}
	};
	$.verto.prototype.hangup = function (callID) {
		var verto = this;
		if (callID) {
			var dialog = verto.dialogs[callID];
			if (dialog) {
				dialog.hangup();
			}
		} else {
			for (var i in verto.dialogs) {
				verto.dialogs[i].hangup();
			}
		}
	};
	$.verto.prototype.newCall = function (args, callbacks) {
		var verto = this;
		if (!verto.rpcClient.socketReady()) {
			console.error("Not Connected...");
			return;
		}
		if (args.useCamera) {
			verto.options.deviceParams.useCamera = args.useCamera;
		}
		var dialog = new $.verto.dialog($.verto.enum.direction.outbound, this, args);
		if (callbacks) {
			dialog.callbacks = callbacks;
		}
		dialog.invite();
		return dialog;
	};
	$.verto.prototype.handleMessage = function (data) {
		var verto = this;
		if (!data || !data.method) {
			console.error("Invalid Data", data);
			return;
		}
		if (data.params.callID) {
			var dialog = verto.dialogs[data.params.callID];
			if (data.method === "verto.attach" && dialog) {
				delete dialog.verto.dialogs[dialog.callID];
				dialog.rtc.stop();
				dialog = null;
			}
			if (dialog) {
				switch (data.method) {
					case "verto.bye":
						dialog.hangup(data.params);
						break;
					case "verto.answer":
						dialog.handleAnswer(data.params);
						break;
					case "verto.media":
						dialog.handleMedia(data.params);
						break;
					case "verto.display":
						dialog.handleDisplay(data.params);
						break;
					case "verto.info":
						dialog.handleInfo(data.params);
						break;
					default:
						console.debug("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED", dialog, data.method);
						break;
				}
			} else {
				switch (data.method) {
					case "verto.attach":
						data.params.attach = true;
						if (data.params.sdp && data.params.sdp.indexOf("m=video") > 0) {
							data.params.useVideo = true;
						}
						if (data.params.sdp && data.params.sdp.indexOf("stereo=1") > 0) {
							data.params.useStereo = true;
						}
						dialog = new $.verto.dialog($.verto.enum.direction.inbound, verto, data.params);
						dialog.setState($.verto.enum.state.recovering);
						break;
					case "verto.invite":
						if (data.params.sdp && data.params.sdp.indexOf("m=video") > 0) {
							data.params.wantVideo = true;
						}
						if (data.params.sdp && data.params.sdp.indexOf("stereo=1") > 0) {
							data.params.useStereo = true;
						}
						dialog = new $.verto.dialog($.verto.enum.direction.inbound, verto, data.params);
						break;
					default:
						console.debug("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED");
						break;
				}
			}
			return { method: data.method };
		} else {
			switch (data.method) {
				case "verto.punt":
					verto.purge();
					verto.logout();
					break;
				case "verto.event":
					var list = null;
					var key = null;
					if (data.params) {
						key = data.params.eventChannel;
					}
					if (key) {
						list = verto.eventSUBS[key];
						if (!list) {
							list = verto.eventSUBS[key.split(".")[0]];
						}
					}
					if (!list && key && key === verto.sessid) {
						if (verto.callbacks.onMessage) {
							verto.callbacks.onMessage(verto, null, $.verto.enum.message.pvtEvent, data.params);
						}
					} else if (!list && key && verto.dialogs[key]) {
						verto.dialogs[key].sendMessage($.verto.enum.message.pvtEvent, data.params);
					} else if (!list) {
						if (!key) {
							key = "UNDEFINED";
						}
						console.error("UNSUBBED or invalid EVENT " + key + " IGNORED");
					} else {
						for (var i in list) {
							var sub = list[i];
							if (!sub || !sub.ready) {
								console.error("invalid EVENT for " + key + " IGNORED");
							} else if (sub.handler) {
								sub.handler(verto, data.params, sub.userData);
							} else if (verto.callbacks.onEvent) {
								verto.callbacks.onEvent(verto, data.params, sub.userData);
							} else {
								console.log("EVENT:", data.params);
							}
						}
					}
					break;
				case "verto.info":
					if (verto.callbacks.onMessage) {
						verto.callbacks.onMessage(verto, null, $.verto.enum.message.info, data.params.msg);
					}
					console.debug("MESSAGE from: " + data.params.msg.from, data.params.msg.body);
					break;
				case "verto.clientReady":
					if (verto.callbacks.onMessage) {
						verto.callbacks.onMessage(verto, null, $.verto.enum.message.clientReady, data.params);
					}
					console.debug("CLIENT READY", data.params);
					break;
				default:
					console.error("INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED", data.method);
					break;
			}
		}
	};
	var del_array = function (array, name) {
		var r = [];
		var len = array.length;
		for (var i = 0; i < len; i++) {
			if (array[i] != name) {
				r.push(array[i]);
			}
		}
		return r;
	};
	var hashArray = function () {
		var vha = this;
		var hash = {};
		var array = [];
		vha.reorder = function (a) {
			array = a;
			var h = hash;
			hash = {};
			var len = array.length;
			for (var i = 0; i < len; i++) {
				var key = array[i];
				if (h[key]) {
					hash[key] = h[key];
					delete h[key];
				}
			}
			h = undefined;
		};
		vha.clear = function () {
			hash = undefined;
			array = undefined;
			hash = {};
			array = [];
		};
		vha.add = function (name, val, insertAt) {
			var redraw = false;
			if (!hash[name]) {
				if (insertAt === undefined || insertAt < 0 || insertAt >= array.length) {
					array.push(name);
				} else {
					var x = 0;
					var n = [];
					var len = array.length;
					for (var i = 0; i < len; i++) {
						if (x++ == insertAt) {
							n.push(name);
						}
						n.push(array[i]);
					}
					array = undefined;
					array = n;
					n = undefined;
					redraw = true;
				}
			}
			hash[name] = val;
			return redraw;
		};
		vha.del = function (name) {
			var r = false;
			if (hash[name]) {
				array = del_array(array, name);
				delete hash[name];
				r = true;
			} else {
				console.error("can't del nonexistant key " + name);
			}
			return r;
		};
		vha.get = function (name) {
			return hash[name];
		};
		vha.order = function () {
			return array;
		};
		vha.hash = function () {
			return hash;
		};
		vha.indexOf = function (name) {
			var len = array.length;
			for (var i = 0; i < len; i++) {
				if (array[i] == name) {
					return i;
				}
			}
		};
		vha.arrayLen = function () {
			return array.length;
		};
		vha.asArray = function () {
			var r = [];
			var len = array.length;
			for (var i = 0; i < len; i++) {
				var key = array[i];
				r.push(hash[key]);
			}
			return r;
		};
		vha.each = function (cb) {
			var len = array.length;
			for (var i = 0; i < len; i++) {
				cb(array[i], hash[array[i]]);
			}
		};
		vha.dump = function (html) {
			var str = "";
			vha.each(function (name, val) {
				str += "name: " + name + " val: " + JSON.stringify(val) + (html ? "<br>" : "\n");
			});
			return str;
		};
	};
	$.verto.liveArray = function (verto, context, name, config) {
		var la = this;
		var lastSerno = 0;
		var binding = null;
		var user_obj = config.userObj;
		var local = false;
		hashArray.call(la);
		la._add = la.add;
		la._del = la.del;
		la._reorder = la.reorder;
		la._clear = la.clear;
		la.context = context;
		la.name = name;
		la.user_obj = user_obj;
		la.verto = verto;
		la.broadcast = function (channel, obj) {
			verto.broadcast(channel, obj);
		};
		la.errs = 0;
		la.clear = function () {
			la._clear();
			lastSerno = 0;
			if (la.onChange) {
				la.onChange(la, { action: "clear" });
			}
		};
		la.checkSerno = function (serno) {
			if (serno < 0) {
				return true;
			}
			if (lastSerno > 0 && serno != lastSerno + 1) {
				if (la.onErr) {
					la.onErr(la, { lastSerno: lastSerno, serno: serno });
				}
				la.errs++;
				console.debug(la.errs);
				if (la.errs < 3) {
					la.bootstrap(la.user_obj);
				}
				return false;
			} else {
				lastSerno = serno;
				return true;
			}
		};
		la.reorder = function (serno, a) {
			if (la.checkSerno(serno)) {
				la._reorder(a);
				if (la.onChange) {
					la.onChange(la, { serno: serno, action: "reorder" });
				}
			}
		};
		la.init = function (serno, val, key, index) {
			if (key === null || key === undefined) {
				key = serno;
			}
			if (la.checkSerno(serno)) {
				if (la.onChange) {
					la.onChange(la, { serno: serno, action: "init", index: index, key: key, data: val });
				}
			}
		};
		la.bootObj = function (serno, val) {
			if (la.checkSerno(serno)) {
				for (var i in val) {
					la._add(val[i][0], val[i][1]);
				}
				if (la.onChange) {
					la.onChange(la, { serno: serno, action: "bootObj", data: val, redraw: true });
				}
			}
		};
		la.add = function (serno, val, key, index) {
			if (key === null || key === undefined) {
				key = serno;
			}
			if (la.checkSerno(serno)) {
				var redraw = la._add(key, val, index);
				if (la.onChange) {
					la.onChange(la, { serno: serno, action: "add", index: index, key: key, data: val, redraw: redraw });
				}
			}
		};
		la.modify = function (serno, val, key, index) {
			if (key === null || key === undefined) {
				key = serno;
			}
			if (la.checkSerno(serno)) {
				la._add(key, val, index);
				if (la.onChange) {
					la.onChange(la, { serno: serno, action: "modify", key: key, data: val, index: index });
				}
			}
		};
		la.del = function (serno, key, index) {
			if (key === null || key === undefined) {
				key = serno;
			}
			if (la.checkSerno(serno)) {
				if (index === null || index < 0 || index === undefined) {
					index = la.indexOf(key);
				}
				var ok = la._del(key);
				if (ok && la.onChange) {
					la.onChange(la, { serno: serno, action: "del", key: key, index: index });
				}
			}
		};
		var eventHandler = function (v, e, la) {
			var packet = e.data;
			if (packet.name != la.name) {
				return;
			}
			switch (packet.action) {
				case "init":
					la.init(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
					break;
				case "bootObj":
					la.bootObj(packet.wireSerno, packet.data);
					break;
				case "add":
					la.add(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
					break;
				case "modify":
					if (!packet.arrIndex && !packet.hashKey) {
						console.error("Invalid Packet", packet);
					} else {
						la.modify(packet.wireSerno, packet.data, packet.hashKey, packet.arrIndex);
					}
					break;
				case "del":
					if (!packet.arrIndex && !packet.hashKey) {
						console.error("Invalid Packet", packet);
					} else {
						la.del(packet.wireSerno, packet.hashKey, packet.arrIndex);
					}
					break;
				case "clear":
					la.clear();
					break;
				case "reorder":
					la.reorder(packet.wireSerno, packet.order);
					break;
				default:
					if (la.checkSerno(packet.wireSerno)) {
						if (la.onChange) {
							la.onChange(la, { serno: packet.wireSerno, action: packet.action, data: packet.data });
						}
					}
					break;
			}
		};
		if (la.context) {
			binding = la.verto.subscribe(la.context, { handler: eventHandler, userData: la, subParams: config.subParams });
		}
		la.destroy = function () {
			la._clear();
			la.verto.unsubscribe(binding);
		};
		la.sendCommand = function (cmd, obj) {
			var self = la;
			self.broadcast(self.context, { liveArray: { command: cmd, context: self.context, name: self.name, obj: obj } });
		};
		la.bootstrap = function (obj) {
			var self = la;
			la.sendCommand("bootstrap", obj);
		};
		la.changepage = function (obj) {
			var self = la;
			self.clear();
			self.broadcast(self.context, { liveArray: { command: "changepage", context: la.context, name: la.name, obj: obj } });
		};
		la.heartbeat = function (obj) {
			var self = la;
			var callback = function () {
				self.heartbeat.call(self, obj);
			};
			self.broadcast(self.context, { liveArray: { command: "heartbeat", context: self.context, name: self.name, obj: obj } });
			self.hb_pid = setTimeout(callback, 3e4);
		};
		la.bootstrap(la.user_obj);
	};
	$.verto.liveTable = function (verto, context, name, jq, config) {
		function genRow(data) {
			if (typeof data[4] === "string" && data[4].indexOf("{") > -1) {
				var tmp = $.parseJSON(data[4]);
				data[4] = tmp.oldStatus;
				data[5] = null;
			}
			return data;
		}
		function genArray(obj) {
			var data = obj.asArray();
			for (var i in data) {
				data[i] = genRow(data[i]);
			}
			return data;
		}
		var dt;
		var la = new $.verto.liveArray(verto, context, name, { subParams: config.subParams });
		var lt = this;
		lt.liveArray = la;
		lt.dataTable = dt;
		lt.verto = verto;
		lt.destroy = function () {
			if (dt) {
				dt.fnDestroy();
			}
			if (la) {
				la.destroy();
			}
			dt = null;
			la = null;
		};
		la.onErr = function (obj, args) {
			console.error("Error: ", obj, args);
		};
		la.onChange = function (obj, args) {
			var index = 0;
			var iserr = 0;
			if (!dt) {
				if (!config.aoColumns) {
					if (args.action != "init") {
						return;
					}
					config.aoColumns = [];
					for (var i in args.data) {
						config.aoColumns.push({ sTitle: args.data[i] });
					}
				}
				dt = jq.dataTable(config);
			}
			if (dt && (args.action == "del" || args.action == "modify")) {
				index = args.index;
				if (index === undefined && args.key) {
					index = la.indexOf(args.key);
				}
				if (index === undefined) {
					console.error("INVALID PACKET Missing INDEX\n", args);
					return;
				}
			}
			if (config.onChange) {
				config.onChange(obj, args);
			}
			try {
				switch (args.action) {
					case "bootObj":
						if (!args.data) {
							console.error("missing data");
							return;
						}
						dt.fnClearTable();
						dt.fnAddData(genArray(obj));
						dt.fnAdjustColumnSizing();
						break;
					case "add":
						if (!args.data) {
							console.error("missing data");
							return;
						}
						if (args.redraw > -1) {
							dt.fnClearTable();
							dt.fnAddData(genArray(obj));
						} else {
							dt.fnAddData(genRow(args.data));
						}
						dt.fnAdjustColumnSizing();
						break;
					case "modify":
						if (!args.data) {
							return;
						}
						dt.fnUpdate(genRow(args.data), index);
						dt.fnAdjustColumnSizing();
						break;
					case "del":
						dt.fnDeleteRow(index);
						dt.fnAdjustColumnSizing();
						break;
					case "clear":
						dt.fnClearTable();
						break;
					case "reorder":
						dt.fnClearTable();
						dt.fnAddData(genArray(obj));
						break;
					case "hide":
						jq.hide();
						break;
					case "show":
						jq.show();
						break;
				}
			} catch (err) {
				console.error("ERROR: " + err);
				iserr++;
			}
			if (iserr) {
				obj.errs++;
				if (obj.errs < 3) {
					obj.bootstrap(obj.user_obj);
				}
			} else {
				obj.errs = 0;
			}
		};
		la.onChange(la, { action: "init" });
	};
	var CONFMAN_SERNO = 1;
	$.verto.conf = function (verto, params) {
		var conf = this;
		conf.params = $.extend({ dialog: null, hasVid: false, laData: null, onBroadcast: null, onLaChange: null, onLaRow: null }, params);
		conf.verto = verto;
		conf.serno = CONFMAN_SERNO++;
		createMainModeratorMethods();
		verto.subscribe(conf.params.laData.modChannel, {
			handler: function (v, e) {
				if (conf.params.onBroadcast) {
					conf.params.onBroadcast(verto, conf, e.data);
				}
			}
		});
		verto.subscribe(conf.params.laData.infoChannel, {
			handler: function (v, e) {
				if (typeof conf.params.infoCallback === "function") {
					conf.params.infoCallback(v, e);
				}
			}
		});
		verto.subscribe(conf.params.laData.chatChannel, {
			handler: function (v, e) {
				if (typeof conf.params.chatCallback === "function") {
					conf.params.chatCallback(v, e);
				}
			}
		});
	};
	$.verto.conf.prototype.modCommand = function (cmd, id, value) {
		var conf = this;
		conf.verto.rpcClient.call("verto.broadcast", { eventChannel: conf.params.laData.modChannel, data: { application: "conf-control", command: cmd, id: id, value: value } });
	};
	$.verto.conf.prototype.destroy = function () {
		var conf = this;
		conf.destroyed = true;
		conf.params.onBroadcast(conf.verto, conf, "destroy");
		if (conf.params.laData.modChannel) {
			conf.verto.unsubscribe(conf.params.laData.modChannel);
		}
		if (conf.params.laData.chatChannel) {
			conf.verto.unsubscribe(conf.params.laData.chatChannel);
		}
		if (conf.params.laData.infoChannel) {
			conf.verto.unsubscribe(conf.params.laData.infoChannel);
		}
	};
	$.verto.modfuncs = {};
	$.verto.confMan = function (verto, params) {
		function genMainMod(jq) {
			var play_id = "play_" + confMan.serno;
			var stop_id = "stop_" + confMan.serno;
			var recording_id = "recording_" + confMan.serno;
			var snapshot_id = "snapshot_" + confMan.serno;
			var rec_stop_id = "recording_stop" + confMan.serno;
			var div_id = "confman_" + confMan.serno;
			var html = "<div id='" + div_id + "'><br>" + "<button class='ctlbtn' id='" + play_id + "'>Play</button>" + "<button class='ctlbtn' id='" + stop_id + "'>Stop</button>" + "<button class='ctlbtn' id='" + recording_id + "'>Record</button>" + "<button class='ctlbtn' id='" + rec_stop_id + "'>Record Stop</button>" + (confMan.params.hasVid ? "<button class='ctlbtn' id='" + snapshot_id + "'>PNG Snapshot</button>" : "") + "<br><br></div>";
			jq.html(html);
			$.verto.modfuncs.change_video_layout = function (id, canvas_id) {
				var val = $("#" + id + " option:selected").text();
				if (val !== "none") {
					confMan.modCommand("vid-layout", null, [val, canvas_id]);
				}
			};
			if (confMan.params.hasVid) {
				for (var j = 0; j < confMan.canvasCount; j++) {
					var vlayout_id = "confman_vid_layout_" + j + "_" + confMan.serno;
					var vlselect_id = "confman_vl_select_" + j + "_" + confMan.serno;
					var vlhtml = "<div id='" + vlayout_id + "'><br>" + "<b>Video Layout Canvas " + (j + 1) + "</b> <select onChange='$.verto.modfuncs.change_video_layout(\"" + vlayout_id + '", "' + (j + 1) + "\")' id='" + vlselect_id + "'></select> " + "<br><br></div>";
					jq.append(vlhtml);
				}
				$("#" + snapshot_id).click(function () {
					var file = prompt("Please enter file name", "");
					if (file) {
						confMan.modCommand("vid-write-png", null, file);
					}
				});
			}
			$("#" + play_id).click(function () {
				var file = prompt("Please enter file name", "");
				if (file) {
					confMan.modCommand("play", null, file);
				}
			});
			$("#" + stop_id).click(function () {
				confMan.modCommand("stop", null, "all");
			});
			$("#" + recording_id).click(function () {
				var file = prompt("Please enter file name", "");
				if (file) {
					confMan.modCommand("recording", null, ["start", file]);
				}
			});
			$("#" + rec_stop_id).click(function () {
				confMan.modCommand("recording", null, ["stop", "all"]);
			});
		}
		function genControls(jq, rowid) {
			var x = parseInt(rowid);
			var kick_id = "kick_" + x;
			var canvas_in_next_id = "canvas_in_next_" + x;
			var canvas_in_prev_id = "canvas_in_prev_" + x;
			var canvas_out_next_id = "canvas_out_next_" + x;
			var canvas_out_prev_id = "canvas_out_prev_" + x;
			var canvas_in_set_id = "canvas_in_set_" + x;
			var canvas_out_set_id = "canvas_out_set_" + x;
			var layer_set_id = "layer_set_" + x;
			var layer_next_id = "layer_next_" + x;
			var layer_prev_id = "layer_prev_" + x;
			var tmute_id = "tmute_" + x;
			var tvmute_id = "tvmute_" + x;
			var vbanner_id = "vbanner_" + x;
			var tvpresenter_id = "tvpresenter_" + x;
			var tvfloor_id = "tvfloor_" + x;
			var box_id = "box_" + x;
			var gainup_id = "gain_in_up" + x;
			var gaindn_id = "gain_in_dn" + x;
			var volup_id = "vol_in_up" + x;
			var voldn_id = "vol_in_dn" + x;
			var transfer_id = "transfer" + x;
			var html = "<div id='" + box_id + "'>";
			html += "<b>General Controls</b><hr noshade>";
			html += "<button class='ctlbtn' id='" + kick_id + "'>Kick</button>" + "<button class='ctlbtn' id='" + tmute_id + "'>Mute</button>" + "<button class='ctlbtn' id='" + gainup_id + "'>Gain -</button>" + "<button class='ctlbtn' id='" + gaindn_id + "'>Gain +</button>" + "<button class='ctlbtn' id='" + voldn_id + "'>Vol -</button>" + "<button class='ctlbtn' id='" + volup_id + "'>Vol +</button>" + "<button class='ctlbtn' id='" + transfer_id + "'>Transfer</button>";
			if (confMan.params.hasVid) {
				html += "<br><br><b>Video Controls</b><hr noshade>";
				html += "<button class='ctlbtn' id='" + tvmute_id + "'>VMute</button>" + "<button class='ctlbtn' id='" + tvpresenter_id + "'>Presenter</button>" + "<button class='ctlbtn' id='" + tvfloor_id + "'>Vid Floor</button>" + "<button class='ctlbtn' id='" + vbanner_id + "'>Banner</button>";
				if (confMan.canvasCount > 1) {
					html += "<br><br><b>Canvas Controls</b><hr noshade>" + "<button class='ctlbtn' id='" + canvas_in_set_id + "'>Set Input Canvas</button>" + "<button class='ctlbtn' id='" + canvas_in_prev_id + "'>Prev Input Canvas</button>" + "<button class='ctlbtn' id='" + canvas_in_next_id + "'>Next Input Canvas</button>" + "<br>" + "<button class='ctlbtn' id='" + canvas_out_set_id + "'>Set Watching Canvas</button>" + "<button class='ctlbtn' id='" + canvas_out_prev_id + "'>Prev Watching Canvas</button>" + "<button class='ctlbtn' id='" + canvas_out_next_id + "'>Next Watching Canvas</button>";
				}
				html += "<br>" + "<button class='ctlbtn' id='" + layer_set_id + "'>Set Layer</button>" + "<button class='ctlbtn' id='" + layer_prev_id + "'>Prev Layer</button>" + "<button class='ctlbtn' id='" + layer_next_id + "'>Next Layer</button>" + "</div>";
			}
			jq.html(html);
			if (!jq.data("mouse")) {
				$("#" + box_id).hide();
			}
			jq.mouseover(function (e) {
				jq.data({ mouse: true });
				$("#" + box_id).show();
			});
			jq.mouseout(function (e) {
				jq.data({ mouse: false });
				$("#" + box_id).hide();
			});
			$("#" + transfer_id).click(function () {
				var xten = prompt("Enter Extension");
				if (xten) {
					confMan.modCommand("transfer", x, xten);
				}
			});
			$("#" + kick_id).click(function () {
				confMan.modCommand("kick", x);
			});
			$("#" + layer_set_id).click(function () {
				var cid = prompt("Please enter layer ID", "");
				if (cid) {
					confMan.modCommand("vid-layer", x, cid);
				}
			});
			$("#" + layer_next_id).click(function () {
				confMan.modCommand("vid-layer", x, "next");
			});
			$("#" + layer_prev_id).click(function () {
				confMan.modCommand("vid-layer", x, "prev");
			});
			$("#" + canvas_in_set_id).click(function () {
				var cid = prompt("Please enter canvas ID", "");
				if (cid) {
					confMan.modCommand("vid-canvas", x, cid);
				}
			});
			$("#" + canvas_out_set_id).click(function () {
				var cid = prompt("Please enter canvas ID", "");
				if (cid) {
					confMan.modCommand("vid-watching-canvas", x, cid);
				}
			});
			$("#" + canvas_in_next_id).click(function () {
				confMan.modCommand("vid-canvas", x, "next");
			});
			$("#" + canvas_in_prev_id).click(function () {
				confMan.modCommand("vid-canvas", x, "prev");
			});
			$("#" + canvas_out_next_id).click(function () {
				confMan.modCommand("vid-watching-canvas", x, "next");
			});
			$("#" + canvas_out_prev_id).click(function () {
				confMan.modCommand("vid-watching-canvas", x, "prev");
			});
			$("#" + tmute_id).click(function () {
				confMan.modCommand("tmute", x);
			});
			if (confMan.params.hasVid) {
				$("#" + tvmute_id).click(function () {
					confMan.modCommand("tvmute", x);
				});
				$("#" + tvpresenter_id).click(function () {
					confMan.modCommand("vid-res-id", x, "presenter");
				});
				$("#" + tvfloor_id).click(function () {
					confMan.modCommand("vid-floor", x, "force");
				});
				$("#" + vbanner_id).click(function () {
					var text = prompt("Please enter text", "");
					if (text) {
						confMan.modCommand("vid-banner", x, escape(text));
					}
				});
			}
			$("#" + gainup_id).click(function () {
				confMan.modCommand("volume_in", x, "up");
			});
			$("#" + gaindn_id).click(function () {
				confMan.modCommand("volume_in", x, "down");
			});
			$("#" + volup_id).click(function () {
				confMan.modCommand("volume_out", x, "up");
			});
			$("#" + voldn_id).click(function () {
				confMan.modCommand("volume_out", x, "down");
			});
			return html;
		}
		var confMan = this;
		confMan.params = $.extend({ tableID: null, statusID: null, mainModID: null, dialog: null, hasVid: false, laData: null, onBroadcast: null, onLaChange: null, onLaRow: null }, params);
		confMan.verto = verto;
		confMan.serno = CONFMAN_SERNO++;
		confMan.canvasCount = confMan.params.laData.canvasCount;
		var atitle = "";
		var awidth = 0;
		verto.subscribe(confMan.params.laData.infoChannel, {
			handler: function (v, e) {
				if (typeof confMan.params.infoCallback === "function") {
					confMan.params.infoCallback(v, e);
				}
			}
		});
		verto.subscribe(confMan.params.laData.chatChannel, {
			handler: function (v, e) {
				if (typeof confMan.params.chatCallback === "function") {
					confMan.params.chatCallback(v, e);
				}
			}
		});
		if (confMan.params.laData.role === "moderator") {
			atitle = "Action";
			awidth = 600;
			if (confMan.params.mainModID) {
				genMainMod($(confMan.params.mainModID));
				$(confMan.params.displayID).html("Moderator Controls Ready<br><br>");
			} else {
				$(confMan.params.mainModID).html("");
			}
			verto.subscribe(confMan.params.laData.modChannel, {
				handler: function (v, e) {
					if (confMan.params.onBroadcast) {
						confMan.params.onBroadcast(verto, confMan, e.data);
					}
					if (e.data["conf-command"] === "list-videoLayouts") {
						for (var j = 0; j < confMan.canvasCount; j++) {
							var vlselect_id = "#confman_vl_select_" + j + "_" + confMan.serno;
							var vlayout_id = "#confman_vid_layout_" + j + "_" + confMan.serno;
							var x = 0;
							var options;
							$(vlselect_id).selectmenu({});
							$(vlselect_id).selectmenu("enable");
							$(vlselect_id).empty();
							$(vlselect_id).append(new Option("Choose a Layout", "none"));
							if (e.data.responseData) {
								var rdata = [];
								for (var i in e.data.responseData) {
									rdata.push(e.data.responseData[i].name);
								}
								options = rdata.sort(function (a, b) {
									var ga = a.substring(0, 6) == "group:" ? true : false;
									var gb = b.substring(0, 6) == "group:" ? true : false;
									if ((ga || gb) && ga != gb) {
										if (ga) {
											return -1;
										} else {
											return 1;
										}
									}
									if (a == b) {
										return 0;
									} else if (a > b) {
										return 1;
									} else {
										return -1;
									}
								});
								for (var i in options) {
									$(vlselect_id).append(new Option(options[i], options[i]));
									x++;
								}
							}
							if (x) {
								$(vlselect_id).selectmenu("refresh", true);
							} else {
								$(vlayout_id).hide();
							}
						}
					} else if (!confMan.destroyed && confMan.params.displayID) {
						$(confMan.params.displayID).html(e.data.response + "<br><br>");
						if (confMan.lastTimeout) {
							clearTimeout(confMan.lastTimeout);
							confMan.lastTimeout = 0;
						}
						confMan.lastTimeout = setTimeout(function () {
							$(confMan.params.displayID).html(confMan.destroyed ? "" : "Moderator Controls Ready<br><br>");
						}, 4e3);
					}
				}
			});
			if (confMan.params.hasVid) {
				confMan.modCommand("list-videoLayouts", null, null);
			}
		}
		var row_callback = null;
		if (confMan.params.laData.role === "moderator") {
			row_callback = function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
				if (!aData[5]) {
					var $row = $("td:eq(5)", nRow);
					genControls($row, aData);
					if (confMan.params.onLaRow) {
						confMan.params.onLaRow(verto, confMan, $row, aData);
					}
				}
			};
		}
		confMan.lt = new $.verto.liveTable(verto, confMan.params.laData.laChannel, confMan.params.laData.laName, $(confMan.params.tableID), {
			subParams: { callID: confMan.params.dialog ? confMan.params.dialog.callID : null }, onChange: function (obj, args) {
				$(confMan.params.statusID).text("Conference Members: " + " (" + obj.arrayLen() + " Total)");
				if (confMan.params.onLaChange) {
					confMan.params.onLaChange(verto, confMan, $.verto.enum.confEvent.laChange, obj, args);
				}
			}, aaData: [], aoColumns: [{ sTitle: "ID", sWidth: "50" }, { sTitle: "Number", sWidth: "250" }, { sTitle: "Name", sWidth: "250" }, { sTitle: "Codec", sWidth: "100" }, { sTitle: "Status", sWidth: confMan.params.hasVid ? "200px" : "150px" }, { sTitle: atitle, sWidth: awidth }], bAutoWidth: true, bDestroy: true, bSort: false, bInfo: false, bFilter: false, bLengthChange: false, bPaginate: false, iDisplayLength: 1400, oLanguage: { sEmptyTable: "The Conference is Empty....." }, fnRowCallback: row_callback
		});
	};
	$.verto.confMan.prototype.modCommand = function (cmd, id, value) {
		var confMan = this;
		confMan.verto.rpcClient.call("verto.broadcast", { eventChannel: confMan.params.laData.modChannel, data: { application: "conf-control", command: cmd, id: id, value: value } });
	};
	$.verto.confMan.prototype.sendChat = function (message, type) {
		var confMan = this;
		confMan.verto.rpcClient.call("verto.broadcast", { eventChannel: confMan.params.laData.chatChannel, data: { action: "send", message: message, type: type } });
	};
	$.verto.confMan.prototype.destroy = function () {
		var confMan = this;
		confMan.destroyed = true;
		if (confMan.lt) {
			confMan.lt.destroy();
		}
		if (confMan.params.laData.chatChannel) {
			confMan.verto.unsubscribe(confMan.params.laData.chatChannel);
		}
		if (confMan.params.laData.modChannel) {
			confMan.verto.unsubscribe(confMan.params.laData.modChannel);
		}
		if (confMan.params.mainModID) {
			$(confMan.params.mainModID).html("");
		}
	};
	$.verto.dialog = function (direction, verto, params) {
		var dialog = this;
		dialog.params = $.extend({ useVideo: verto.options.useVideo, useStereo: verto.options.useStereo, screenShare: false, useCamera: false, useMic: verto.options.deviceParams.useMic, useSpeak: verto.options.deviceParams.useSpeak, tag: verto.options.tag, localTag: verto.options.localTag, login: verto.options.login, videoParams: verto.options.videoParams, useStream: verto.options.useStream }, params);
		if (!dialog.params.screenShare) {
			dialog.params.useCamera = verto.options.deviceParams.useCamera;
		}
		dialog.verto = verto;
		dialog.direction = direction;
		dialog.lastState = null;
		dialog.state = dialog.lastState = $.verto.enum.state.new;
		dialog.callbacks = verto.callbacks;
		dialog.answered = false;
		dialog.attach = params.attach || false;
		dialog.screenShare = params.screenShare || false;
		dialog.useCamera = dialog.params.useCamera;
		dialog.useMic = dialog.params.useMic;
		dialog.useSpeak = dialog.params.useSpeak;
		if (dialog.params.callID) {
			dialog.callID = dialog.params.callID;
		} else {
			dialog.callID = dialog.params.callID = generateGUID();
		}
		if (typeof dialog.params.tag === "function") {
			dialog.params.tag = dialog.params.tag();
		}
		if (dialog.params.tag) {
			dialog.audioStream = document.getElementById(dialog.params.tag);
			if (dialog.params.useVideo) {
				dialog.videoStream = dialog.audioStream;
			}
		}
		if (dialog.params.localTag) {
			dialog.localVideo = document.getElementById(dialog.params.localTag);
		}
		dialog.verto.dialogs[dialog.callID] = dialog;
		var RTCcallbacks = {};
		if (dialog.direction == $.verto.enum.direction.inbound) {
			if (dialog.params.display_direction === "outbound") {
				dialog.params.remote_caller_id_name = dialog.params.caller_id_name;
				dialog.params.remote_caller_id_number = dialog.params.caller_id_number;
			} else {
				dialog.params.remote_caller_id_name = dialog.params.callee_id_name;
				dialog.params.remote_caller_id_number = dialog.params.callee_id_number;
			}
			if (!dialog.params.remote_caller_id_name) {
				dialog.params.remote_caller_id_name = "Nobody";
			}
			if (!dialog.params.remote_caller_id_number) {
				dialog.params.remote_caller_id_number = "UNKNOWN";
			}
			RTCcallbacks.onMessage = function (rtc, msg) {
				console.debug(msg);
			};
			RTCcallbacks.onAnswerSDP = function (rtc, sdp) {
				console.error("answer sdp", sdp);
			};
		} else {
			dialog.params.remote_caller_id_name = "Outbound Call";
			dialog.params.remote_caller_id_number = dialog.params.destination_number;
		}
		RTCcallbacks.onICESDP = function (rtc) {
			console.log("RECV " + rtc.type + " SDP", rtc.mediaData.SDP);
			if (dialog.state == $.verto.enum.state.requesting || dialog.state == $.verto.enum.state.answering || dialog.state == $.verto.enum.state.active) {
				location.reload();
				return;
			}
			if (rtc.type == "offer") {
				if (dialog.state == $.verto.enum.state.active) {
					dialog.setState($.verto.enum.state.requesting);
					dialog.sendMethod("verto.attach", { sdp: rtc.mediaData.SDP });
				} else {
					dialog.setState($.verto.enum.state.requesting);
					dialog.sendMethod("verto.invite", { sdp: rtc.mediaData.SDP });
				}
			} else {
				dialog.setState($.verto.enum.state.answering);
				dialog.sendMethod(dialog.attach ? "verto.attach" : "verto.answer", { sdp: dialog.rtc.mediaData.SDP });
			}
		};
		RTCcallbacks.onICE = function (rtc) {
			if (rtc.type == "offer") {
				console.log("offer", rtc.mediaData.candidate);
				return;
			}
		};
		RTCcallbacks.onStream = function (rtc, stream) {
			if (dialog.callbacks.permissionCallback && typeof dialog.callbacks.permissionCallback.onGranted === "function") {
				dialog.callbacks.permissionCallback.onGranted(stream);
			} else if (dialog.verto.options.permissionCallback && typeof dialog.verto.options.permissionCallback.onGranted === "function") {
				dialog.verto.options.permissionCallback.onGranted(stream);
			}
			console.log("stream started");
		};
		RTCcallbacks.onRemoteStream = function (rtc, stream) {
			if (typeof dialog.callbacks.onRemoteStream === "function") {
				dialog.callbacks.onRemoteStream(stream, dialog);
			}
			console.log("remote stream started");
		};
		RTCcallbacks.onError = function (e) {
			if (dialog.callbacks.permissionCallback && typeof dialog.callbacks.permissionCallback.onDenied === "function") {
				dialog.callbacks.permissionCallback.onDenied();
			} else if (dialog.verto.options.permissionCallback && typeof dialog.verto.options.permissionCallback.onDenied === "function") {
				dialog.verto.options.permissionCallback.onDenied();
			}
			console.error("ERROR:", e);
			dialog.hangup({ cause: "Device or Permission Error" });
		};
		dialog.rtc = new $.FSRTC({ callbacks: RTCcallbacks, localVideo: dialog.screenShare ? null : dialog.localVideo, useVideo: dialog.params.useVideo ? dialog.videoStream : null, useAudio: dialog.audioStream, useStereo: dialog.params.useStereo, videoParams: dialog.params.videoParams, audioParams: verto.options.audioParams, iceServers: verto.options.iceServers, screenShare: dialog.screenShare, useCamera: dialog.useCamera, useMic: dialog.useMic, useSpeak: dialog.useSpeak, turnServer: verto.options.turnServer, useStream: dialog.params.useStream });
		dialog.rtc.verto = dialog.verto;
		if (dialog.direction == $.verto.enum.direction.inbound) {
			if (dialog.attach) {
				dialog.answer();
			} else {
				dialog.ring();
			}
		}
	};
	$.verto.dialog.prototype.invite = function () {
		var dialog = this;
		dialog.rtc.call();
	};
	$.verto.dialog.prototype.sendMethod = function (method, obj) {
		var dialog = this;
		obj.dialogParams = {};
		for (var i in dialog.params) {
			if (i == "sdp" && method != "verto.invite" && method != "verto.attach") {
				continue;
			}
			if (obj.noDialogParams && i != "callID") {
				continue;
			}
			obj.dialogParams[i] = dialog.params[i];
		}
		delete obj.noDialogParams;
		dialog.verto.rpcClient.call(method, obj, function (e) {
			dialog.processReply(method, true, e);
		}, function (e) {
			dialog.processReply(method, false, e);
		});
	};
	$.verto.dialog.prototype.setAudioPlaybackDevice = function (sinkId, callback, arg) {
		var dialog = this;
		var element = dialog.audioStream;
		if (typeof element.sinkId === "undefined") {
			console.warn("Dialog: " + dialog.callID + " Browser does not support output device selection.");
			if (callback) {
				callback(false, null, arg);
			}
		} else {
			var devname = find_name(sinkId);
			console.info("Dialog: " + dialog.callID + " Setting speaker:", element, devname);
			element.setSinkId(sinkId).then(function () {
				console.log("Dialog: " + dialog.callID + " Success, audio output device attached: " + sinkId);
				if (callback) {
					callback(true, devname, arg);
				}
			}).catch(function (error) {
				var errorMessage = error;
				if (error.name === "SecurityError") {
					errorMessage = "Dialog: " + dialog.callID + " You need to use HTTPS for selecting audio output " + "device: " + error;
				}
				if (callback) {
					callback(false, null, arg);
				}
				console.error(errorMessage);
			});
		}
	};
	$.verto.dialog.prototype.setState = function (state) {
		var dialog = this;
		if (dialog.state == $.verto.enum.state.ringing) {
			dialog.stopRinging();
		}
		if (dialog.state == state || !checkStateChange(dialog.state, state)) {
			console.error("Dialog " + dialog.callID + ": INVALID state change from " + dialog.state.name + " to " + state.name);
			dialog.hangup();
			return false;
		}
		console.log("Dialog " + dialog.callID + ": state change from " + dialog.state.name + " to " + state.name);
		dialog.lastState = dialog.state;
		dialog.state = state;
		if (dialog.callbacks.onDialogState) {
			dialog.callbacks.onDialogState(this);
		}
		switch (dialog.state) {
			case $.verto.enum.state.early:
			case $.verto.enum.state.active:
				var speaker = dialog.useSpeak;
				console.info("Using Speaker: ", speaker);
				if (speaker && speaker !== "any" && speaker !== "none") {
					setTimeout(function () {
						dialog.setAudioPlaybackDevice(speaker);
					}, 500);
				}
				break;
			case $.verto.enum.state.trying:
				setTimeout(function () {
					if (dialog.state == $.verto.enum.state.trying) {
						dialog.setState($.verto.enum.state.hangup);
					}
				}, 3e4);
				break;
			case $.verto.enum.state.purge:
				dialog.setState($.verto.enum.state.destroy);
				break;
			case $.verto.enum.state.hangup:
				if (dialog.lastState.val > $.verto.enum.state.requesting.val && dialog.lastState.val < $.verto.enum.state.hangup.val) {
					dialog.sendMethod("verto.bye", {});
				}
				dialog.setState($.verto.enum.state.destroy);
				break;
			case $.verto.enum.state.destroy:
				if (typeof dialog.verto.options.tag === "function") {
					$("#" + dialog.params.tag).remove();
				}
				delete dialog.verto.dialogs[dialog.callID];
				if (dialog.params.screenShare) {
					dialog.rtc.stopPeer();
				} else {
					dialog.rtc.stop();
				}
				break;
		}
		return true;
	};
	$.verto.dialog.prototype.processReply = function (method, success, e) {
		var dialog = this;
		switch (method) {
			case "verto.answer":
			case "verto.attach":
				if (success) {
					dialog.setState($.verto.enum.state.active);
				} else {
					dialog.hangup();
				}
				break;
			case "verto.invite":
				if (success) {
					dialog.setState($.verto.enum.state.trying);
				} else {
					dialog.setState($.verto.enum.state.destroy);
				}
				break;
			case "verto.bye":
				dialog.hangup();
				break;
			case "verto.modify":
				if (e.holdState) {
					if (e.holdState == "held") {
						if (dialog.state != $.verto.enum.state.held) {
							dialog.setState($.verto.enum.state.held);
						}
					} else if (e.holdState == "active") {
						if (dialog.state != $.verto.enum.state.active) {
							dialog.setState($.verto.enum.state.active);
						}
					}
				}
				if (success) { }
				break;
			default:
				break;
		}
	};
	$.verto.dialog.prototype.hangup = function (params) {
		var dialog = this;
		if (params) {
			if (params.causeCode) {
				dialog.causeCode = params.causeCode;
			}
			if (params.cause) {
				dialog.cause = params.cause;
			}
		}
		if (!dialog.cause && !dialog.causeCode) {
			dialog.cause = "NORMAL_CLEARING";
		}
		if (dialog.state.val >= $.verto.enum.state.new.val && dialog.state.val < $.verto.enum.state.hangup.val) {
			dialog.setState($.verto.enum.state.hangup);
		} else if (dialog.state.val < $.verto.enum.state.destroy) {
			dialog.setState($.verto.enum.state.destroy);
		}
	};
	$.verto.dialog.prototype.stopRinging = function () {
		var dialog = this;
		if (dialog.verto.ringer) {
			dialog.verto.ringer.stop();
		}
	};
	$.verto.dialog.prototype.indicateRing = function () {
		var dialog = this;
		if (dialog.verto.ringer) {
			dialog.verto.ringer.attr("src", dialog.verto.options.ringFile)[0].play();
			setTimeout(function () {
				dialog.stopRinging();
				if (dialog.state == $.verto.enum.state.ringing) {
					dialog.indicateRing();
				}
			}, dialog.verto.options.ringSleep);
		}
	};
	$.verto.dialog.prototype.ring = function () {
		var dialog = this;
		dialog.setState($.verto.enum.state.ringing);
		dialog.indicateRing();
	};
	$.verto.dialog.prototype.useVideo = function (on) {
		var dialog = this;
		dialog.params.useVideo = on;
		if (on) {
			dialog.videoStream = dialog.audioStream;
		} else {
			dialog.videoStream = null;
		}
		dialog.rtc.useVideo(dialog.videoStream, dialog.localVideo);
	};
	$.verto.dialog.prototype.setMute = function (what) {
		var dialog = this;
		return dialog.rtc.setMute(what);
	};
	$.verto.dialog.prototype.getMute = function () {
		var dialog = this;
		return dialog.rtc.getMute();
	};
	$.verto.dialog.prototype.setVideoMute = function (what) {
		var dialog = this;
		return dialog.rtc.setVideoMute(what);
	};
	$.verto.dialog.prototype.getVideoMute = function () {
		var dialog = this;
		return dialog.rtc.getVideoMute();
	};
	$.verto.dialog.prototype.useStereo = function (on) {
		var dialog = this;
		dialog.params.useStereo = on;
		dialog.rtc.useStereo(on);
	};
	$.verto.dialog.prototype.dtmf = function (digits) {
		var dialog = this;
		if (digits) {
			dialog.sendMethod("verto.info", { dtmf: digits });
		}
	};
	$.verto.dialog.prototype.rtt = function (obj) {
		var dialog = this;
		var pobj = {};
		if (!obj) {
			return false;
		}
		pobj.code = obj.code;
		pobj.chars = obj.chars;
		if (pobj.chars || pobj.code) {
			dialog.sendMethod("verto.info", { txt: obj, noDialogParams: true });
		}
	};
	$.verto.dialog.prototype.transfer = function (dest, params) {
		var dialog = this;
		if (dest) {
			dialog.sendMethod("verto.modify", { action: "transfer", destination: dest, params: params });
		}
	};
	$.verto.dialog.prototype.replace = function (replaceCallID, params) {
		var dialog = this;
		if (replaceCallID) {
			dialog.sendMethod("verto.modify", { action: "replace", replaceCallID: replaceCallID, params: params });
		}
	};
	$.verto.dialog.prototype.hold = function (params) {
		var dialog = this;
		dialog.sendMethod("verto.modify", { action: "hold", params: params });
	};
	$.verto.dialog.prototype.unhold = function (params) {
		var dialog = this;
		dialog.sendMethod("verto.modify", { action: "unhold", params: params });
	};
	$.verto.dialog.prototype.toggleHold = function (params) {
		var dialog = this;
		dialog.sendMethod("verto.modify", { action: "toggleHold", params: params });
	};
	$.verto.dialog.prototype.message = function (msg) {
		var dialog = this;
		var err = 0;
		msg.from = dialog.params.login;
		if (!msg.to) {
			console.error("Missing To");
			err++;
		}
		if (!msg.body) {
			console.error("Missing Body");
			err++;
		}
		if (err) {
			return false;
		}
		dialog.sendMethod("verto.info", { msg: msg });
		return true;
	};
	$.verto.dialog.prototype.answer = function (params) {
		var dialog = this;
		if (!dialog.answered) {
			if (!params) {
				params = {};
			}
			params.sdp = dialog.params.sdp;
			if (params) {
				if (params.useVideo) {
					dialog.useVideo(true);
				}
				dialog.params.callee_id_name = params.callee_id_name;
				dialog.params.callee_id_number = params.callee_id_number;
				if (params.useCamera) {
					dialog.useCamera = params.useCamera;
				}
				if (params.useMic) {
					dialog.useMic = params.useMic;
				}
				if (params.useSpeak) {
					dialog.useSpeak = params.useSpeak;
				}
			}
			dialog.rtc.createAnswer(params);
			dialog.answered = true;
		}
	};
	$.verto.dialog.prototype.handleAnswer = function (params) {
		var dialog = this;
		dialog.gotAnswer = true;
		if (dialog.state.val >= $.verto.enum.state.active.val) {
			return;
		}
		if (dialog.state.val >= $.verto.enum.state.early.val) {
			dialog.setState($.verto.enum.state.active);
		} else if (dialog.gotEarly) {
			console.log("Dialog " + dialog.callID + " Got answer while still establishing early media, delaying...");
		} else {
			console.log("Dialog " + dialog.callID + " Answering Channel");
			dialog.rtc.answer(params.sdp, function () {
				dialog.setState($.verto.enum.state.active);
			}, function (e) {
				console.error(e);
				dialog.hangup();
			});
			console.log("Dialog " + dialog.callID + "ANSWER SDP", params.sdp);
		}
	};
	$.verto.dialog.prototype.cidString = function (enc) {
		var dialog = this;
		var party = dialog.params.remote_caller_id_name + (enc ? " &lt;" : " <") + dialog.params.remote_caller_id_number + (enc ? "&gt;" : ">");
		return party;
	};
	$.verto.dialog.prototype.sendMessage = function (msg, params) {
		var dialog = this;
		if (dialog.callbacks.onMessage) {
			dialog.callbacks.onMessage(dialog.verto, dialog, msg, params);
		}
	};
	$.verto.dialog.prototype.handleInfo = function (params) {
		var dialog = this;
		dialog.sendMessage($.verto.enum.message.info, params);
	};
	$.verto.dialog.prototype.handleDisplay = function (params) {
		var dialog = this;
		if (params.display_name) {
			dialog.params.remote_caller_id_name = params.display_name;
		}
		if (params.display_number) {
			dialog.params.remote_caller_id_number = params.display_number;
		}
		dialog.sendMessage($.verto.enum.message.display, {});
	};
	$.verto.dialog.prototype.handleMedia = function (params) {
		var dialog = this;
		if (dialog.state.val >= $.verto.enum.state.early.val) {
			return;
		}
		dialog.gotEarly = true;
		dialog.rtc.answer(params.sdp, function () {
			console.log("Dialog " + dialog.callID + "Establishing early media");
			dialog.setState($.verto.enum.state.early);
			if (dialog.gotAnswer) {
				console.log("Dialog " + dialog.callID + "Answering Channel");
				dialog.setState($.verto.enum.state.active);
			}
		}, function (e) {
			console.error(e);
			dialog.hangup();
		});
		console.log("Dialog " + dialog.callID + "EARLY SDP", params.sdp);
	};
	$.verto.ENUM = function (s) {
		var i = 0;
		var o = {};
		s.split(" ").map(function (x) {
			o[x] = { name: x, val: i++ };
		});
		return Object.freeze(o);
	};
	$.verto.enum = {};
	$.verto.enum.states = Object.freeze({ new: { requesting: 1, recovering: 1, ringing: 1, destroy: 1, answering: 1, hangup: 1 }, requesting: { trying: 1, hangup: 1, active: 1 }, recovering: { answering: 1, hangup: 1 }, trying: { active: 1, early: 1, hangup: 1 }, ringing: { answering: 1, hangup: 1 }, answering: { active: 1, hangup: 1 }, active: { answering: 1, requesting: 1, hangup: 1, held: 1 }, held: { hangup: 1, active: 1 }, early: { hangup: 1, active: 1 }, hangup: { destroy: 1 }, destroy: {}, purge: { destroy: 1 } });
	$.verto.enum.state = $.verto.ENUM("new requesting trying recovering ringing answering early active held hangup destroy purge");
	$.verto.enum.direction = $.verto.ENUM("inbound outbound");
	$.verto.enum.message = $.verto.ENUM("display info pvtEvent clientReady");
	$.verto.enum = Object.freeze($.verto.enum);
	$.verto.saved = [];
	$.verto.unloadJobs = [];
	var unloadEventName = "beforeunload";
	var iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
	if (iOS) {
		unloadEventName = "pagehide";
	}
	$(window).bind(unloadEventName, function () {
		for (var f in $.verto.unloadJobs) {
			$.verto.unloadJobs[f]();
		}
		if ($.verto.haltClosure) {
			return $.verto.haltClosure();
		}
		for (var i in $.verto.saved) {
			var verto = $.verto.saved[i];
			if (verto) {
				verto.purge();
				verto.logout();
			}
		}
		return $.verto.warnOnUnload;
	});
	$.verto.videoDevices = [];
	$.verto.audioInDevices = [];
	$.verto.audioOutDevices = [];
	var checkDevices = function (runtime) {
		function gotDevices(deviceInfos) {
			for (var i = 0; i !== deviceInfos.length; ++i) {
				var deviceInfo = deviceInfos[i];
				var text = "";
				console.log(deviceInfo);
				console.log(deviceInfo.kind + ": " + deviceInfo.label + " id = " + deviceInfo.deviceId);
				if (deviceInfo.kind === "audioinput") {
					text = deviceInfo.label || "microphone " + (aud_in.length + 1);
					aud_in.push({ id: deviceInfo.deviceId, kind: "audio_in", label: text });
				} else if (deviceInfo.kind === "audiooutput") {
					text = deviceInfo.label || "speaker " + (aud_out.length + 1);
					aud_out.push({ id: deviceInfo.deviceId, kind: "audio_out", label: text });
				} else if (deviceInfo.kind === "videoinput") {
					text = deviceInfo.label || "camera " + (vid.length + 1);
					vid.push({ id: deviceInfo.deviceId, kind: "video", label: text });
				} else {
					console.log("Some other kind of source/device: ", deviceInfo);
				}
			}
			$.verto.videoDevices = vid;
			$.verto.audioInDevices = aud_in;
			$.verto.audioOutDevices = aud_out;
			console.info("Audio IN Devices", $.verto.audioInDevices);
			console.info("Audio Out Devices", $.verto.audioOutDevices);
			console.info("Video Devices", $.verto.videoDevices);
			if (Xstream) {
				Xstream.getTracks().forEach(function (track) {
					track.stop();
				});
			}
			if (runtime) {
				runtime(true);
			}
		}
		function handleError(error) {
			console.log("device enumeration error: ", error);
			if (runtime) {
				runtime(false);
			}
		}
		function checkTypes(devs) {
			for (var i = 0; i !== devs.length; ++i) {
				if (devs[i].kind === "audioinput") {
					has_audio++;
				} else if (devs[i].kind === "videoinput") {
					has_video++;
				}
			}
			navigator.getUserMedia({ audio: has_audio > 0 ? true : false, video: has_video > 0 ? true : false }, function (stream) {
				Xstream = stream;
				navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
			}, function (err) {
				console.log("The following error occurred: " + err.name);
			});
		}
		console.info("enumerating devices");
		var aud_in = [];
		var aud_out = [];
		var vid = [];
		var has_video = 0;
		var has_audio = 0;
		var Xstream;
		navigator.mediaDevices.enumerateDevices().then(checkTypes).catch(handleError);
	};
	$.verto.refreshDevices = function (runtime) {
		checkDevices(runtime);
	};
	$.verto.init = function (obj, runtime) {
		if (!obj) {
			obj = {};
		}
		if (!obj.skipPermCheck && !obj.skipDeviceCheck) {
			$.FSRTC.checkPerms(function (status) {
				checkDevices(runtime);
			}, true, true);
		} else if (obj.skipPermCheck && !obj.skipDeviceCheck) {
			checkDevices(runtime);
		} else if (!obj.skipPermCheck && obj.skipDeviceCheck) {
			$.FSRTC.checkPerms(function (status) {
				runtime(status);
			}, true, true);
		} else {
			runtime(null);
		}
	};
	$.verto.genUUID = function () {
		return generateGUID();
	};
}());
(function () {
	var f = function () {
		var define;
		var module;
		var exports;
		return function e() {
			function s(o, u) {
				if (!n[o]) {
					if (!t[o]) {
						var a = typeof require == "function" && require;
						if (!u && a) {
							return a(o, true);
						}
						if (i) {
							return i(o, true);
						}
						var f = new Error("Cannot find module '" + o + "'");
						f.code = "MODULE_NOT_FOUND";
						throw f;
					}
					var l = n[o] = { exports: {} };
					t[o][0].call(l.exports, function (e) {
						var n = t[o][1][e];
						return s(n ? n : e);
					}, l, l.exports, e, t, n, r);
				}
				return n[o].exports;
			}
			var t = {
				1: [function (require, module, exports) {
					"use strict";
					function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
						var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
						sdp += SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters());
						sdp += SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === "offer" ? "actpass" : dtlsRole || "active");
						sdp += "a=mid:" + transceiver.mid + "\r\n";
						if (transceiver.rtpSender && transceiver.rtpReceiver) {
							sdp += "a=sendrecv\r\n";
						} else if (transceiver.rtpSender) {
							sdp += "a=sendonly\r\n";
						} else if (transceiver.rtpReceiver) {
							sdp += "a=recvonly\r\n";
						} else {
							sdp += "a=inactive\r\n";
						}
						if (transceiver.rtpSender) {
							var msid = "msid:" + stream.id + " " + transceiver.rtpSender.track.id + "\r\n";
							sdp += "a=" + msid;
							sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " " + msid;
							if (transceiver.sendEncodingParameters[0].rtx) {
								sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " " + msid;
								sdp += "a=ssrc-group:FID " + transceiver.sendEncodingParameters[0].ssrc + " " + transceiver.sendEncodingParameters[0].rtx.ssrc + "\r\n";
							}
						}
						sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " cname:" + SDPUtils.localCName + "\r\n";
						if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
							sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " cname:" + SDPUtils.localCName + "\r\n";
						}
						return sdp;
					}
					function filterIceServers(iceServers, edgeVersion) {
						var hasTurn = false;
						iceServers = JSON.parse(JSON.stringify(iceServers));
						return iceServers.filter(function (server) {
							if (server && (server.urls || server.url)) {
								var urls = server.urls || server.url;
								if (server.url && !server.urls) {
									console.warn("RTCIceServer.url is deprecated! Use urls instead.");
								}
								var isString = typeof urls === "string";
								if (isString) {
									urls = [urls];
								}
								urls = urls.filter(function (url) {
									var validTurn = url.indexOf("turn:") === 0 && url.indexOf("transport=udp") !== -1 && url.indexOf("turn:[") === -1 && !hasTurn;
									if (validTurn) {
										hasTurn = true;
										return true;
									}
									return url.indexOf("stun:") === 0 && edgeVersion >= 14393 && url.indexOf("?transport=udp") === -1;
								});
								delete server.url;
								server.urls = isString ? urls[0] : urls;
								return !!urls.length;
							}
						});
					}
					function getCommonCapabilities(localCapabilities, remoteCapabilities) {
						var commonCapabilities = { codecs: [], headerExtensions: [], fecMechanisms: [] };
						var findCodecByPayloadType = function (pt, codecs) {
							pt = parseInt(pt, 10);
							for (var i = 0; i < codecs.length; i++) {
								if (codecs[i].payloadType === pt || codecs[i].preferredPayloadType === pt) {
									return codecs[i];
								}
							}
						};
						var rtxCapabilityMatches = function (lRtx, rRtx, lCodecs, rCodecs) {
							var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
							var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
							return lCodec && rCodec && lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
						};
						localCapabilities.codecs.forEach(function (lCodec) {
							for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
								var rCodec = remoteCapabilities.codecs[i];
								if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() && lCodec.clockRate === rCodec.clockRate) {
									if (lCodec.name.toLowerCase() === "rtx" && lCodec.parameters && rCodec.parameters.apt) {
										if (!rtxCapabilityMatches(lCodec, rCodec, localCapabilities.codecs, remoteCapabilities.codecs)) {
											continue;
										}
									}
									rCodec = JSON.parse(JSON.stringify(rCodec));
									rCodec.numChannels = Math.min(lCodec.numChannels, rCodec.numChannels);
									commonCapabilities.codecs.push(rCodec);
									rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function (fb) {
										for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
											if (lCodec.rtcpFeedback[j].type === fb.type && lCodec.rtcpFeedback[j].parameter === fb.parameter) {
												return true;
											}
										}
										return false;
									});
									break;
								}
							}
						});
						localCapabilities.headerExtensions.forEach(function (lHeaderExtension) {
							for (var i = 0; i < remoteCapabilities.headerExtensions.length; i++) {
								var rHeaderExtension = remoteCapabilities.headerExtensions[i];
								if (lHeaderExtension.uri === rHeaderExtension.uri) {
									commonCapabilities.headerExtensions.push(rHeaderExtension);
									break;
								}
							}
						});
						return commonCapabilities;
					}
					function isActionAllowedInSignalingState(action, type, signalingState) {
						return { offer: { setLocalDescription: ["stable", "have-local-offer"], setRemoteDescription: ["stable", "have-remote-offer"] }, answer: { setLocalDescription: ["have-remote-offer", "have-local-pranswer"], setRemoteDescription: ["have-local-offer", "have-remote-pranswer"] } }[type][action].indexOf(signalingState) !== -1;
					}
					function maybeAddCandidate(iceTransport, candidate) {
						var alreadyAdded = iceTransport.getRemoteCandidates().find(function (remoteCandidate) {
							return candidate.foundation === remoteCandidate.foundation && candidate.ip === remoteCandidate.ip && candidate.port === remoteCandidate.port && candidate.priority === remoteCandidate.priority && candidate.protocol === remoteCandidate.protocol && candidate.type === remoteCandidate.type;
						});
						if (!alreadyAdded) {
							iceTransport.addRemoteCandidate(candidate);
						}
						return !alreadyAdded;
					}
					function addTrackToStreamAndFireEvent(track, stream) {
						stream.addTrack(track);
						var e = new Event("addtrack");
						e.track = track;
						stream.dispatchEvent(e);
					}
					function removeTrackFromStreamAndFireEvent(track, stream) {
						stream.removeTrack(track);
						var e = new Event("removetrack");
						e.track = track;
						stream.dispatchEvent(e);
					}
					function fireAddTrack(pc, track, receiver, streams) {
						var trackEvent = new Event("track");
						trackEvent.track = track;
						trackEvent.receiver = receiver;
						trackEvent.transceiver = { receiver: receiver };
						trackEvent.streams = streams;
						window.setTimeout(function () {
							pc._dispatchEvent("track", trackEvent);
						});
					}
					function makeError(name, description) {
						var e = new Error(description);
						e.name = name;
						return e;
					}
					var SDPUtils = require("sdp");
					module.exports = function (window, edgeVersion) {
						var RTCPeerConnection = function (config) {
							var pc = this;
							var _eventTarget = document.createDocumentFragment();
							["addEventListener", "removeEventListener", "dispatchEvent"].forEach(function (method) {
								pc[method] = _eventTarget[method].bind(_eventTarget);
							});
							this.canTrickleIceCandidates = null;
							this.needNegotiation = false;
							this.localStreams = [];
							this.remoteStreams = [];
							this.localDescription = null;
							this.remoteDescription = null;
							this.signalingState = "stable";
							this.iceConnectionState = "new";
							this.iceGatheringState = "new";
							config = JSON.parse(JSON.stringify(config || {}));
							this.usingBundle = config.bundlePolicy === "max-bundle";
							if (config.rtcpMuxPolicy === "negotiate") {
								throw makeError("NotSupportedError", "rtcpMuxPolicy 'negotiate' is not supported");
							} else if (!config.rtcpMuxPolicy) {
								config.rtcpMuxPolicy = "require";
							}
							switch (config.iceTransportPolicy) {
								case "all":
								case "relay":
									break;
								default:
									config.iceTransportPolicy = "all";
									break;
							}
							switch (config.bundlePolicy) {
								case "balanced":
								case "max-compat":
								case "max-bundle":
									break;
								default:
									config.bundlePolicy = "balanced";
									break;
							}
							config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);
							this._iceGatherers = [];
							if (config.iceCandidatePoolSize) {
								for (var i = config.iceCandidatePoolSize; i > 0; i--) {
									this._iceGatherers = new window.RTCIceGatherer({ iceServers: config.iceServers, gatherPolicy: config.iceTransportPolicy });
								}
							} else {
								config.iceCandidatePoolSize = 0;
							}
							this._config = config;
							this.transceivers = [];
							this._sdpSessionId = SDPUtils.generateSessionId();
							this._sdpSessionVersion = 0;
							this._dtlsRole = undefined;
							this._isClosed = false;
						};
						RTCPeerConnection.prototype.onicecandidate = null;
						RTCPeerConnection.prototype.onaddstream = null;
						RTCPeerConnection.prototype.ontrack = null;
						RTCPeerConnection.prototype.onremovestream = null;
						RTCPeerConnection.prototype.onsignalingstatechange = null;
						RTCPeerConnection.prototype.oniceconnectionstatechange = null;
						RTCPeerConnection.prototype.onicegatheringstatechange = null;
						RTCPeerConnection.prototype.onnegotiationneeded = null;
						RTCPeerConnection.prototype.ondatachannel = null;
						RTCPeerConnection.prototype._dispatchEvent = function (name, event) {
							if (this._isClosed) {
								return;
							}
							this.dispatchEvent(event);
							if (typeof this["on" + name] === "function") {
								this["on" + name](event);
							}
						};
						RTCPeerConnection.prototype._emitGatheringStateChange = function () {
							var event = new Event("icegatheringstatechange");
							this._dispatchEvent("icegatheringstatechange", event);
						};
						RTCPeerConnection.prototype.getConfiguration = function () {
							return this._config;
						};
						RTCPeerConnection.prototype.getLocalStreams = function () {
							return this.localStreams;
						};
						RTCPeerConnection.prototype.getRemoteStreams = function () {
							return this.remoteStreams;
						};
						RTCPeerConnection.prototype._createTransceiver = function (kind) {
							var hasBundleTransport = this.transceivers.length > 0;
							var transceiver = { track: null, iceGatherer: null, iceTransport: null, dtlsTransport: null, localCapabilities: null, remoteCapabilities: null, rtpSender: null, rtpReceiver: null, kind: kind, mid: null, sendEncodingParameters: null, recvEncodingParameters: null, stream: null, associatedRemoteMediaStreams: [], wantReceive: true };
							if (this.usingBundle && hasBundleTransport) {
								transceiver.iceTransport = this.transceivers[0].iceTransport;
								transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
							} else {
								var transports = this._createIceAndDtlsTransports();
								transceiver.iceTransport = transports.iceTransport;
								transceiver.dtlsTransport = transports.dtlsTransport;
							}
							this.transceivers.push(transceiver);
							return transceiver;
						};
						RTCPeerConnection.prototype.addTrack = function (track, stream) {
							var alreadyExists = this.transceivers.find(function (s) {
								return s.track === track;
							});
							if (alreadyExists) {
								throw makeError("InvalidAccessError", "Track already exists.");
							}
							if (this.signalingState === "closed") {
								throw makeError("InvalidStateError", "Attempted to call addTrack on a closed peerconnection.");
							}
							var transceiver;
							for (var i = 0; i < this.transceivers.length; i++) {
								if (!this.transceivers[i].track && this.transceivers[i].kind === track.kind) {
									transceiver = this.transceivers[i];
								}
							}
							if (!transceiver) {
								transceiver = this._createTransceiver(track.kind);
							}
							this._maybeFireNegotiationNeeded();
							if (this.localStreams.indexOf(stream) === -1) {
								this.localStreams.push(stream);
							}
							transceiver.track = track;
							transceiver.stream = stream;
							transceiver.rtpSender = new window.RTCRtpSender(track, transceiver.dtlsTransport);
							return transceiver.rtpSender;
						};
						RTCPeerConnection.prototype.addStream = function (stream) {
							var pc = this;
							if (edgeVersion >= 15025) {
								stream.getTracks().forEach(function (track) {
									pc.addTrack(track, stream);
								});
							} else {
								var clonedStream = stream.clone();
								stream.getTracks().forEach(function (track, idx) {
									var clonedTrack = clonedStream.getTracks()[idx];
									track.addEventListener("enabled", function (event) {
										clonedTrack.enabled = event.enabled;
									});
								});
								clonedStream.getTracks().forEach(function (track) {
									pc.addTrack(track, clonedStream);
								});
							}
						};
						RTCPeerConnection.prototype.removeTrack = function (sender) {
							if (!(sender instanceof window.RTCRtpSender)) {
								throw new TypeError("Argument 1 of RTCPeerConnection.removeTrack " + "does not implement interface RTCRtpSender.");
							}
							var transceiver = this.transceivers.find(function (t) {
								return t.rtpSender === sender;
							});
							if (!transceiver) {
								throw makeError("InvalidAccessError", "Sender was not created by this connection.");
							}
							var stream = transceiver.stream;
							transceiver.rtpSender.stop();
							transceiver.rtpSender = null;
							transceiver.track = null;
							transceiver.stream = null;
							var localStreams = this.transceivers.map(function (t) {
								return t.stream;
							});
							if (localStreams.indexOf(stream) === -1 && this.localStreams.indexOf(stream) > -1) {
								this.localStreams.splice(this.localStreams.indexOf(stream), 1);
							}
							this._maybeFireNegotiationNeeded();
						};
						RTCPeerConnection.prototype.removeStream = function (stream) {
							var pc = this;
							stream.getTracks().forEach(function (track) {
								var sender = pc.getSenders().find(function (s) {
									return s.track === track;
								});
								if (sender) {
									pc.removeTrack(sender);
								}
							});
						};
						RTCPeerConnection.prototype.getSenders = function () {
							return this.transceivers.filter(function (transceiver) {
								return !!transceiver.rtpSender;
							}).map(function (transceiver) {
								return transceiver.rtpSender;
							});
						};
						RTCPeerConnection.prototype.getReceivers = function () {
							return this.transceivers.filter(function (transceiver) {
								return !!transceiver.rtpReceiver;
							}).map(function (transceiver) {
								return transceiver.rtpReceiver;
							});
						};
						RTCPeerConnection.prototype._createIceGatherer = function (sdpMLineIndex, usingBundle) {
							var pc = this;
							if (usingBundle && sdpMLineIndex > 0) {
								return this.transceivers[0].iceGatherer;
							} else if (this._iceGatherers.length) {
								return this._iceGatherers.shift();
							}
							var iceGatherer = new window.RTCIceGatherer({ iceServers: this._config.iceServers, gatherPolicy: this._config.iceTransportPolicy });
							Object.defineProperty(iceGatherer, "state", { value: "new", writable: true });
							this.transceivers[sdpMLineIndex].candidates = [];
							this.transceivers[sdpMLineIndex].bufferCandidates = function (event) {
								var end = !event.candidate || Object.keys(event.candidate).length === 0;
								iceGatherer.state = end ? "completed" : "gathering";
								if (pc.transceivers[sdpMLineIndex].candidates !== null) {
									pc.transceivers[sdpMLineIndex].candidates.push(event.candidate);
								}
							};
							iceGatherer.addEventListener("localcandidate", this.transceivers[sdpMLineIndex].bufferCandidates);
							return iceGatherer;
						};
						RTCPeerConnection.prototype._gather = function (mid, sdpMLineIndex) {
							var pc = this;
							var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
							if (iceGatherer.onlocalcandidate) {
								return;
							}
							var candidates = this.transceivers[sdpMLineIndex].candidates;
							this.transceivers[sdpMLineIndex].candidates = null;
							iceGatherer.removeEventListener("localcandidate", this.transceivers[sdpMLineIndex].bufferCandidates);
							iceGatherer.onlocalcandidate = function (evt) {
								if (pc.usingBundle && sdpMLineIndex > 0) {
									return;
								}
								var event = new Event("icecandidate");
								event.candidate = { sdpMid: mid, sdpMLineIndex: sdpMLineIndex };
								var cand = evt.candidate;
								var end = !cand || Object.keys(cand).length === 0;
								if (end) {
									if (iceGatherer.state === "new" || iceGatherer.state === "gathering") {
										iceGatherer.state = "completed";
									}
								} else {
									if (iceGatherer.state === "new") {
										iceGatherer.state = "gathering";
									}
									cand.component = 1;
									event.candidate.candidate = SDPUtils.writeCandidate(cand);
								}
								var sections = SDPUtils.splitSections(pc.localDescription.sdp);
								if (!end) {
									sections[event.candidate.sdpMLineIndex + 1] += "a=" + event.candidate.candidate + "\r\n";
								} else {
									sections[event.candidate.sdpMLineIndex + 1] += "a=end-of-candidates\r\n";
								}
								pc.localDescription.sdp = sections.join("");
								var complete = pc.transceivers.every(function (transceiver) {
									return transceiver.iceGatherer && transceiver.iceGatherer.state === "completed";
								});
								if (pc.iceGatheringState !== "gathering") {
									pc.iceGatheringState = "gathering";
									pc._emitGatheringStateChange();
								}
								if (!end) {
									pc._dispatchEvent("icecandidate", event);
								}
								if (complete) {
									pc._dispatchEvent("icecandidate", new Event("icecandidate"));
									pc.iceGatheringState = "complete";
									pc._emitGatheringStateChange();
								}
							};
							window.setTimeout(function () {
								candidates.forEach(function (candidate) {
									var e = new Event("RTCIceGatherEvent");
									e.candidate = candidate;
									iceGatherer.onlocalcandidate(e);
								});
							}, 0);
						};
						RTCPeerConnection.prototype._createIceAndDtlsTransports = function () {
							var pc = this;
							var iceTransport = new window.RTCIceTransport(null);
							iceTransport.onicestatechange = function () {
								pc._updateConnectionState();
							};
							var dtlsTransport = new window.RTCDtlsTransport(iceTransport);
							dtlsTransport.ondtlsstatechange = function () {
								pc._updateConnectionState();
							};
							dtlsTransport.onerror = function () {
								Object.defineProperty(dtlsTransport, "state", { value: "failed", writable: true });
								pc._updateConnectionState();
							};
							return { iceTransport: iceTransport, dtlsTransport: dtlsTransport };
						};
						RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function (sdpMLineIndex) {
							var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
							if (iceGatherer) {
								delete iceGatherer.onlocalcandidate;
								delete this.transceivers[sdpMLineIndex].iceGatherer;
							}
							var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
							if (iceTransport) {
								delete iceTransport.onicestatechange;
								delete this.transceivers[sdpMLineIndex].iceTransport;
							}
							var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
							if (dtlsTransport) {
								delete dtlsTransport.ondtlsstatechange;
								delete dtlsTransport.onerror;
								delete this.transceivers[sdpMLineIndex].dtlsTransport;
							}
						};
						RTCPeerConnection.prototype._transceive = function (transceiver, send, recv) {
							var params = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
							if (send && transceiver.rtpSender) {
								params.encodings = transceiver.sendEncodingParameters;
								params.rtcp = { cname: SDPUtils.localCName, compound: transceiver.rtcpParameters.compound };
								if (transceiver.recvEncodingParameters.length) {
									params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
								}
								transceiver.rtpSender.send(params);
							}
							if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
								if (transceiver.kind === "video" && transceiver.recvEncodingParameters && edgeVersion < 15019) {
									transceiver.recvEncodingParameters.forEach(function (p) {
										delete p.rtx;
									});
								}
								if (transceiver.recvEncodingParameters.length) {
									params.encodings = transceiver.recvEncodingParameters;
								}
								params.rtcp = { compound: transceiver.rtcpParameters.compound };
								if (transceiver.rtcpParameters.cname) {
									params.rtcp.cname = transceiver.rtcpParameters.cname;
								}
								if (transceiver.sendEncodingParameters.length) {
									params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
								}
								transceiver.rtpReceiver.receive(params);
							}
						};
						RTCPeerConnection.prototype.setLocalDescription = function (description) {
							var pc = this;
							if (!isActionAllowedInSignalingState("setLocalDescription", description.type, this.signalingState) || this._isClosed) {
								return Promise.reject(makeError("InvalidStateError", "Can not set local " + description.type + " in state " + pc.signalingState));
							}
							var sections;
							var sessionpart;
							if (description.type === "offer") {
								sections = SDPUtils.splitSections(description.sdp);
								sessionpart = sections.shift();
								sections.forEach(function (mediaSection, sdpMLineIndex) {
									var caps = SDPUtils.parseRtpParameters(mediaSection);
									pc.transceivers[sdpMLineIndex].localCapabilities = caps;
								});
								this.transceivers.forEach(function (transceiver, sdpMLineIndex) {
									pc._gather(transceiver.mid, sdpMLineIndex);
								});
							} else if (description.type === "answer") {
								sections = SDPUtils.splitSections(pc.remoteDescription.sdp);
								sessionpart = sections.shift();
								var isIceLite = SDPUtils.matchPrefix(sessionpart, "a=ice-lite").length > 0;
								sections.forEach(function (mediaSection, sdpMLineIndex) {
									var transceiver = pc.transceivers[sdpMLineIndex];
									var iceGatherer = transceiver.iceGatherer;
									var iceTransport = transceiver.iceTransport;
									var dtlsTransport = transceiver.dtlsTransport;
									var localCapabilities = transceiver.localCapabilities;
									var remoteCapabilities = transceiver.remoteCapabilities;
									var rejected = SDPUtils.isRejected(mediaSection) && SDPUtils.matchPrefix(mediaSection, "a=bundle-only").length === 0;
									if (!rejected && !transceiver.isDatachannel) {
										var remoteIceParameters = SDPUtils.getIceParameters(mediaSection, sessionpart);
										var remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection, sessionpart);
										if (isIceLite) {
											remoteDtlsParameters.role = "server";
										}
										if (!pc.usingBundle || sdpMLineIndex === 0) {
											pc._gather(transceiver.mid, sdpMLineIndex);
											if (iceTransport.state === "new") {
												iceTransport.start(iceGatherer, remoteIceParameters, isIceLite ? "controlling" : "controlled");
											}
											if (dtlsTransport.state === "new") {
												dtlsTransport.start(remoteDtlsParameters);
											}
										}
										var params = getCommonCapabilities(localCapabilities, remoteCapabilities);
										pc._transceive(transceiver, params.codecs.length > 0, false);
									}
								});
							}
							this.localDescription = { type: description.type, sdp: description.sdp };
							switch (description.type) {
								case "offer":
									this._updateSignalingState("have-local-offer");
									break;
								case "answer":
									this._updateSignalingState("stable");
									break;
								default:
									throw new TypeError('unsupported type "' + description.type + '"');
							}
							return Promise.resolve();
						};
						RTCPeerConnection.prototype.setRemoteDescription = function (description) {
							var pc = this;
							if (!isActionAllowedInSignalingState("setRemoteDescription", description.type, this.signalingState) || this._isClosed) {
								return Promise.reject(makeError("InvalidStateError", "Can not set remote " + description.type + " in state " + pc.signalingState));
							}
							var streams = {};
							this.remoteStreams.forEach(function (stream) {
								streams[stream.id] = stream;
							});
							var receiverList = [];
							var sections = SDPUtils.splitSections(description.sdp);
							var sessionpart = sections.shift();
							var isIceLite = SDPUtils.matchPrefix(sessionpart, "a=ice-lite").length > 0;
							var usingBundle = SDPUtils.matchPrefix(sessionpart, "a=group:BUNDLE ").length > 0;
							this.usingBundle = usingBundle;
							var iceOptions = SDPUtils.matchPrefix(sessionpart, "a=ice-options:")[0];
							if (iceOptions) {
								this.canTrickleIceCandidates = iceOptions.substr(14).split(" ").indexOf("trickle") >= 0;
							} else {
								this.canTrickleIceCandidates = false;
							}
							sections.forEach(function (mediaSection, sdpMLineIndex) {
								var lines = SDPUtils.splitLines(mediaSection);
								var kind = SDPUtils.getKind(mediaSection);
								var rejected = SDPUtils.isRejected(mediaSection) && SDPUtils.matchPrefix(mediaSection, "a=bundle-only").length === 0;
								var protocol = lines[0].substr(2).split(" ")[2];
								var direction = SDPUtils.getDirection(mediaSection, sessionpart);
								var remoteMsid = SDPUtils.parseMsid(mediaSection);
								var mid = SDPUtils.getMid(mediaSection) || SDPUtils.generateIdentifier();
								if (kind === "application" && protocol === "DTLS/SCTP") {
									pc.transceivers[sdpMLineIndex] = { mid: mid, isDatachannel: true };
									return;
								}
								var transceiver;
								var iceGatherer;
								var iceTransport;
								var dtlsTransport;
								var rtpReceiver;
								var sendEncodingParameters;
								var localCapabilities;
								var track;
								var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
								var remoteIceParameters;
								var remoteDtlsParameters;
								if (!rejected) {
									remoteIceParameters = SDPUtils.getIceParameters(mediaSection, sessionpart);
									remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection, sessionpart);
									remoteDtlsParameters.role = "client";
								}
								var recvEncodingParameters = SDPUtils.parseRtpEncodingParameters(mediaSection);
								var rtcpParameters = SDPUtils.parseRtcpParameters(mediaSection);
								var isComplete = SDPUtils.matchPrefix(mediaSection, "a=end-of-candidates", sessionpart).length > 0;
								var cands = SDPUtils.matchPrefix(mediaSection, "a=candidate:").map(function (cand) {
									return SDPUtils.parseCandidate(cand);
								}).filter(function (cand) {
									return cand.component === 1;
								});
								if ((description.type === "offer" || description.type === "answer") && !rejected && usingBundle && sdpMLineIndex > 0 && pc.transceivers[sdpMLineIndex]) {
									pc._disposeIceAndDtlsTransports(sdpMLineIndex);
									pc.transceivers[sdpMLineIndex].iceGatherer = pc.transceivers[0].iceGatherer;
									pc.transceivers[sdpMLineIndex].iceTransport = pc.transceivers[0].iceTransport;
									pc.transceivers[sdpMLineIndex].dtlsTransport = pc.transceivers[0].dtlsTransport;
									if (pc.transceivers[sdpMLineIndex].rtpSender) {
										pc.transceivers[sdpMLineIndex].rtpSender.setTransport(pc.transceivers[0].dtlsTransport);
									}
									if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
										pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(pc.transceivers[0].dtlsTransport);
									}
								}
								if (description.type === "offer" && !rejected) {
									transceiver = pc.transceivers[sdpMLineIndex] || pc._createTransceiver(kind);
									transceiver.mid = mid;
									if (!transceiver.iceGatherer) {
										transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, usingBundle);
									}
									if (cands.length && transceiver.iceTransport.state === "new") {
										if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
											transceiver.iceTransport.setRemoteCandidates(cands);
										} else {
											cands.forEach(function (candidate) {
												maybeAddCandidate(transceiver.iceTransport, candidate);
											});
										}
									}
									localCapabilities = window.RTCRtpReceiver.getCapabilities(kind);
									if (edgeVersion < 15019) {
										localCapabilities.codecs = localCapabilities.codecs.filter(function (codec) {
											return codec.name !== "rtx";
										});
									}
									sendEncodingParameters = transceiver.sendEncodingParameters || [{ ssrc: (2 * sdpMLineIndex + 2) * 1001 }];
									var isNewTrack = false;
									if (direction === "sendrecv" || direction === "sendonly") {
										isNewTrack = !transceiver.rtpReceiver;
										rtpReceiver = transceiver.rtpReceiver || new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);
										if (isNewTrack) {
											var stream;
											track = rtpReceiver.track;
											if (remoteMsid && remoteMsid.stream === "-") { } else if (remoteMsid) {
												if (!streams[remoteMsid.stream]) {
													streams[remoteMsid.stream] = new window.MediaStream;
													Object.defineProperty(streams[remoteMsid.stream], "id", {
														get: function () {
															return remoteMsid.stream;
														}
													});
												}
												Object.defineProperty(track, "id", {
													get: function () {
														return remoteMsid.track;
													}
												});
												stream = streams[remoteMsid.stream];
											} else {
												if (!streams.default) {
													streams.default = new window.MediaStream;
												}
												stream = streams.default;
											}
											if (stream) {
												addTrackToStreamAndFireEvent(track, stream);
												transceiver.associatedRemoteMediaStreams.push(stream);
											}
											receiverList.push([track, rtpReceiver, stream]);
										}
									} else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
										transceiver.associatedRemoteMediaStreams.forEach(function (s) {
											var nativeTrack = s.getTracks().find(function (t) {
												return t.id === transceiver.rtpReceiver.track.id;
											});
											if (nativeTrack) {
												removeTrackFromStreamAndFireEvent(nativeTrack, s);
											}
										});
										transceiver.associatedRemoteMediaStreams = [];
									}
									transceiver.localCapabilities = localCapabilities;
									transceiver.remoteCapabilities = remoteCapabilities;
									transceiver.rtpReceiver = rtpReceiver;
									transceiver.rtcpParameters = rtcpParameters;
									transceiver.sendEncodingParameters = sendEncodingParameters;
									transceiver.recvEncodingParameters = recvEncodingParameters;
									pc._transceive(pc.transceivers[sdpMLineIndex], false, isNewTrack);
								} else if (description.type === "answer" && !rejected) {
									transceiver = pc.transceivers[sdpMLineIndex];
									iceGatherer = transceiver.iceGatherer;
									iceTransport = transceiver.iceTransport;
									dtlsTransport = transceiver.dtlsTransport;
									rtpReceiver = transceiver.rtpReceiver;
									sendEncodingParameters = transceiver.sendEncodingParameters;
									localCapabilities = transceiver.localCapabilities;
									pc.transceivers[sdpMLineIndex].recvEncodingParameters = recvEncodingParameters;
									pc.transceivers[sdpMLineIndex].remoteCapabilities = remoteCapabilities;
									pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;
									if (cands.length && iceTransport.state === "new") {
										if ((isIceLite || isComplete) && (!usingBundle || sdpMLineIndex === 0)) {
											iceTransport.setRemoteCandidates(cands);
										} else {
											cands.forEach(function (candidate) {
												maybeAddCandidate(transceiver.iceTransport, candidate);
											});
										}
									}
									if (!usingBundle || sdpMLineIndex === 0) {
										if (iceTransport.state === "new") {
											iceTransport.start(iceGatherer, remoteIceParameters, "controlling");
										}
										if (dtlsTransport.state === "new") {
											dtlsTransport.start(remoteDtlsParameters);
										}
									}
									pc._transceive(transceiver, direction === "sendrecv" || direction === "recvonly", direction === "sendrecv" || direction === "sendonly");
									if (rtpReceiver && (direction === "sendrecv" || direction === "sendonly")) {
										track = rtpReceiver.track;
										if (remoteMsid) {
											if (!streams[remoteMsid.stream]) {
												streams[remoteMsid.stream] = new window.MediaStream;
											}
											addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
											receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
										} else {
											if (!streams.default) {
												streams.default = new window.MediaStream;
											}
											addTrackToStreamAndFireEvent(track, streams.default);
											receiverList.push([track, rtpReceiver, streams.default]);
										}
									} else {
										delete transceiver.rtpReceiver;
									}
								}
							});
							if (this._dtlsRole === undefined) {
								this._dtlsRole = description.type === "offer" ? "active" : "passive";
							}
							this.remoteDescription = { type: description.type, sdp: description.sdp };
							switch (description.type) {
								case "offer":
									this._updateSignalingState("have-remote-offer");
									break;
								case "answer":
									this._updateSignalingState("stable");
									break;
								default:
									throw new TypeError('unsupported type "' + description.type + '"');
							}
							Object.keys(streams).forEach(function (sid) {
								var stream = streams[sid];
								if (stream.getTracks().length) {
									if (pc.remoteStreams.indexOf(stream) === -1) {
										pc.remoteStreams.push(stream);
										var event = new Event("addstream");
										event.stream = stream;
										window.setTimeout(function () {
											pc._dispatchEvent("addstream", event);
										});
									}
									receiverList.forEach(function (item) {
										var track = item[0];
										var receiver = item[1];
										if (stream.id !== item[2].id) {
											return;
										}
										fireAddTrack(pc, track, receiver, [stream]);
									});
								}
							});
							receiverList.forEach(function (item) {
								if (item[2]) {
									return;
								}
								fireAddTrack(pc, item[0], item[1], []);
							});
							window.setTimeout(function () {
								if (!pc || !pc.transceivers) {
									return;
								}
								pc.transceivers.forEach(function (transceiver) {
									if (transceiver.iceTransport && transceiver.iceTransport.state === "new" && transceiver.iceTransport.getRemoteCandidates().length > 0) {
										console.warn("Timeout for addRemoteCandidate. Consider sending " + "an end-of-candidates notification");
										transceiver.iceTransport.addRemoteCandidate({});
									}
								});
							}, 4e3);
							return Promise.resolve();
						};
						RTCPeerConnection.prototype.close = function () {
							this.transceivers.forEach(function (transceiver) {
								if (transceiver.iceTransport) {
									transceiver.iceTransport.stop();
								}
								if (transceiver.dtlsTransport) {
									transceiver.dtlsTransport.stop();
								}
								if (transceiver.rtpSender) {
									transceiver.rtpSender.stop();
								}
								if (transceiver.rtpReceiver) {
									transceiver.rtpReceiver.stop();
								}
							});
							this._isClosed = true;
							this._updateSignalingState("closed");
						};
						RTCPeerConnection.prototype._updateSignalingState = function (newState) {
							this.signalingState = newState;
							var event = new Event("signalingstatechange");
							this._dispatchEvent("signalingstatechange", event);
						};
						RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function () {
							var pc = this;
							if (this.signalingState !== "stable" || this.needNegotiation === true) {
								return;
							}
							this.needNegotiation = true;
							window.setTimeout(function () {
								if (pc.needNegotiation === false) {
									return;
								}
								pc.needNegotiation = false;
								var event = new Event("negotiationneeded");
								pc._dispatchEvent("negotiationneeded", event);
							}, 0);
						};
						RTCPeerConnection.prototype._updateConnectionState = function () {
							var newState;
							var states = { new: 0, closed: 0, connecting: 0, checking: 0, connected: 0, completed: 0, disconnected: 0, failed: 0 };
							this.transceivers.forEach(function (transceiver) {
								states[transceiver.iceTransport.state]++;
								states[transceiver.dtlsTransport.state]++;
							});
							states.connected += states.completed;
							newState = "new";
							if (states.failed > 0) {
								newState = "failed";
							} else if (states.connecting > 0 || states.checking > 0) {
								newState = "connecting";
							} else if (states.disconnected > 0) {
								newState = "disconnected";
							} else if (states.new > 0) {
								newState = "new";
							} else if (states.connected > 0 || states.completed > 0) {
								newState = "connected";
							}
							if (newState !== this.iceConnectionState) {
								this.iceConnectionState = newState;
								var event = new Event("iceconnectionstatechange");
								this._dispatchEvent("iceconnectionstatechange", event);
							}
						};
						RTCPeerConnection.prototype.createOffer = function () {
							var pc = this;
							if (this._isClosed) {
								return Promise.reject(makeError("InvalidStateError", "Can not call createOffer after close"));
							}
							var numAudioTracks = this.transceivers.filter(function (t) {
								return t.kind === "audio";
							}).length;
							var numVideoTracks = this.transceivers.filter(function (t) {
								return t.kind === "video";
							}).length;
							var offerOptions = arguments[0];
							if (offerOptions) {
								if (offerOptions.mandatory || offerOptions.optional) {
									throw new TypeError("Legacy mandatory/optional constraints not supported.");
								}
								if (offerOptions.offerToReceiveAudio !== undefined) {
									if (offerOptions.offerToReceiveAudio === true) {
										numAudioTracks = 1;
									} else if (offerOptions.offerToReceiveAudio === false) {
										numAudioTracks = 0;
									} else {
										numAudioTracks = offerOptions.offerToReceiveAudio;
									}
								}
								if (offerOptions.offerToReceiveVideo !== undefined) {
									if (offerOptions.offerToReceiveVideo === true) {
										numVideoTracks = 1;
									} else if (offerOptions.offerToReceiveVideo === false) {
										numVideoTracks = 0;
									} else {
										numVideoTracks = offerOptions.offerToReceiveVideo;
									}
								}
							}
							this.transceivers.forEach(function (transceiver) {
								if (transceiver.kind === "audio") {
									numAudioTracks--;
									if (numAudioTracks < 0) {
										transceiver.wantReceive = false;
									}
								} else if (transceiver.kind === "video") {
									numVideoTracks--;
									if (numVideoTracks < 0) {
										transceiver.wantReceive = false;
									}
								}
							});
							while (numAudioTracks > 0 || numVideoTracks > 0) {
								if (numAudioTracks > 0) {
									this._createTransceiver("audio");
									numAudioTracks--;
								}
								if (numVideoTracks > 0) {
									this._createTransceiver("video");
									numVideoTracks--;
								}
							}
							var sdp = SDPUtils.writeSessionBoilerplate(this._sdpSessionId, this._sdpSessionVersion++);
							this.transceivers.forEach(function (transceiver, sdpMLineIndex) {
								var track = transceiver.track;
								var kind = transceiver.kind;
								var mid = SDPUtils.generateIdentifier();
								transceiver.mid = mid;
								if (!transceiver.iceGatherer) {
									transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, pc.usingBundle);
								}
								var localCapabilities = window.RTCRtpSender.getCapabilities(kind);
								if (edgeVersion < 15019) {
									localCapabilities.codecs = localCapabilities.codecs.filter(function (codec) {
										return codec.name !== "rtx";
									});
								}
								localCapabilities.codecs.forEach(function (codec) {
									if (codec.name === "H264" && codec.parameters["level-asymmetry-allowed"] === undefined) {
										codec.parameters["level-asymmetry-allowed"] = "1";
									}
								});
								var sendEncodingParameters = transceiver.sendEncodingParameters || [{ ssrc: (2 * sdpMLineIndex + 1) * 1001 }];
								if (track) {
									if (edgeVersion >= 15019 && kind === "video" && !sendEncodingParameters[0].rtx) {
										sendEncodingParameters[0].rtx = { ssrc: sendEncodingParameters[0].ssrc + 1 };
									}
								}
								if (transceiver.wantReceive) {
									transceiver.rtpReceiver = new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);
								}
								transceiver.localCapabilities = localCapabilities;
								transceiver.sendEncodingParameters = sendEncodingParameters;
							});
							if (this._config.bundlePolicy !== "max-compat") {
								sdp += "a=group:BUNDLE " + this.transceivers.map(function (t) {
									return t.mid;
								}).join(" ") + "\r\n";
							}
							sdp += "a=ice-options:trickle\r\n";
							this.transceivers.forEach(function (transceiver, sdpMLineIndex) {
								sdp += writeMediaSection(transceiver, transceiver.localCapabilities, "offer", transceiver.stream, pc._dtlsRole);
								sdp += "a=rtcp-rsize\r\n";
								if (transceiver.iceGatherer && pc.iceGatheringState !== "new" && (sdpMLineIndex === 0 || !pc.usingBundle)) {
									transceiver.iceGatherer.getLocalCandidates().forEach(function (cand) {
										cand.component = 1;
										sdp += "a=" + SDPUtils.writeCandidate(cand) + "\r\n";
									});
									if (transceiver.iceGatherer.state === "completed") {
										sdp += "a=end-of-candidates\r\n";
									}
								}
							});
							var desc = new window.RTCSessionDescription({ type: "offer", sdp: sdp });
							return Promise.resolve(desc);
						};
						RTCPeerConnection.prototype.createAnswer = function () {
							var pc = this;
							if (this._isClosed) {
								return Promise.reject(makeError("InvalidStateError", "Can not call createAnswer after close"));
							}
							var sdp = SDPUtils.writeSessionBoilerplate(this._sdpSessionId, this._sdpSessionVersion++);
							if (this.usingBundle) {
								sdp += "a=group:BUNDLE " + this.transceivers.map(function (t) {
									return t.mid;
								}).join(" ") + "\r\n";
							}
							var mediaSectionsInOffer = SDPUtils.splitSections(this.remoteDescription.sdp).length - 1;
							this.transceivers.forEach(function (transceiver, sdpMLineIndex) {
								if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
									return;
								}
								if (transceiver.isDatachannel) {
									sdp += "m=application 0 DTLS/SCTP 5000\r\n" + "c=IN IP4 0.0.0.0\r\n" + "a=mid:" + transceiver.mid + "\r\n";
									return;
								}
								if (transceiver.stream) {
									var localTrack;
									if (transceiver.kind === "audio") {
										localTrack = transceiver.stream.getAudioTracks()[0];
									} else if (transceiver.kind === "video") {
										localTrack = transceiver.stream.getVideoTracks()[0];
									}
									if (localTrack) {
										if (edgeVersion >= 15019 && transceiver.kind === "video" && !transceiver.sendEncodingParameters[0].rtx) {
											transceiver.sendEncodingParameters[0].rtx = { ssrc: transceiver.sendEncodingParameters[0].ssrc + 1 };
										}
									}
								}
								var commonCapabilities = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
								var hasRtx = commonCapabilities.codecs.filter(function (c) {
									return c.name.toLowerCase() === "rtx";
								}).length;
								if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
									delete transceiver.sendEncodingParameters[0].rtx;
								}
								sdp += writeMediaSection(transceiver, commonCapabilities, "answer", transceiver.stream, pc._dtlsRole);
								if (transceiver.rtcpParameters && transceiver.rtcpParameters.reducedSize) {
									sdp += "a=rtcp-rsize\r\n";
								}
							});
							var desc = new window.RTCSessionDescription({ type: "answer", sdp: sdp });
							return Promise.resolve(desc);
						};
						RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
							var sections;
							if (!candidate || candidate.candidate === "") {
								for (var j = 0; j < this.transceivers.length; j++) {
									if (this.transceivers[j].isDatachannel) {
										continue;
									}
									this.transceivers[j].iceTransport.addRemoteCandidate({});
									sections = SDPUtils.splitSections(this.remoteDescription.sdp);
									sections[j + 1] += "a=end-of-candidates\r\n";
									this.remoteDescription.sdp = sections.join("");
									if (this.usingBundle) {
										break;
									}
								}
							} else if (candidate.sdpMLineIndex === undefined && !candidate.sdpMid) {
								throw new TypeError("sdpMLineIndex or sdpMid required");
							} else if (!this.remoteDescription) {
								return Promise.reject(makeError("InvalidStateError", "Can not add ICE candidate without a remote description"));
							} else {
								var sdpMLineIndex = candidate.sdpMLineIndex;
								if (candidate.sdpMid) {
									for (var i = 0; i < this.transceivers.length; i++) {
										if (this.transceivers[i].mid === candidate.sdpMid) {
											sdpMLineIndex = i;
											break;
										}
									}
								}
								var transceiver = this.transceivers[sdpMLineIndex];
								if (transceiver) {
									if (transceiver.isDatachannel) {
										return Promise.resolve();
									}
									var cand = Object.keys(candidate.candidate).length > 0 ? SDPUtils.parseCandidate(candidate.candidate) : {};
									if (cand.protocol === "tcp" && (cand.port === 0 || cand.port === 9)) {
										return Promise.resolve();
									}
									if (cand.component && cand.component !== 1) {
										return Promise.resolve();
									}
									if (sdpMLineIndex === 0 || sdpMLineIndex > 0 && transceiver.iceTransport !== this.transceivers[0].iceTransport) {
										if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
											return Promise.reject(makeError("OperationError", "Can not add ICE candidate"));
										}
									}
									var candidateString = candidate.candidate.trim();
									if (candidateString.indexOf("a=") === 0) {
										candidateString = candidateString.substr(2);
									}
									sections = SDPUtils.splitSections(this.remoteDescription.sdp);
									sections[sdpMLineIndex + 1] += "a=" + (cand.type ? candidateString : "end-of-candidates") + "\r\n";
									this.remoteDescription.sdp = sections.join("");
								} else {
									return Promise.reject(makeError("OperationError", "Can not add ICE candidate"));
								}
							}
							return Promise.resolve();
						};
						RTCPeerConnection.prototype.getStats = function () {
							var promises = [];
							this.transceivers.forEach(function (transceiver) {
								["rtpSender", "rtpReceiver", "iceGatherer", "iceTransport", "dtlsTransport"].forEach(function (method) {
									if (transceiver[method]) {
										promises.push(transceiver[method].getStats());
									}
								});
							});
							var fixStatsType = function (stat) {
								return { inboundrtp: "inbound-rtp", outboundrtp: "outbound-rtp", candidatepair: "candidate-pair", localcandidate: "local-candidate", remotecandidate: "remote-candidate" }[stat.type] || stat.type;
							};
							return new Promise(function (resolve) {
								var results = new Map;
								Promise.all(promises).then(function (res) {
									res.forEach(function (result) {
										Object.keys(result).forEach(function (id) {
											result[id].type = fixStatsType(result[id]);
											results.set(id, result[id]);
										});
									});
									resolve(results);
								});
							});
						};
						var methods = ["createOffer", "createAnswer"];
						methods.forEach(function (method) {
							var nativeMethod = RTCPeerConnection.prototype[method];
							RTCPeerConnection.prototype[method] = function () {
								var args = arguments;
								if (typeof args[0] === "function" || typeof args[1] === "function") {
									return nativeMethod.apply(this, [arguments[2]]).then(function (description) {
										if (typeof args[0] === "function") {
											args[0].apply(null, [description]);
										}
									}, function (error) {
										if (typeof args[1] === "function") {
											args[1].apply(null, [error]);
										}
									});
								}
								return nativeMethod.apply(this, arguments);
							};
						});
						methods = ["setLocalDescription", "setRemoteDescription", "addIceCandidate"];
						methods.forEach(function (method) {
							var nativeMethod = RTCPeerConnection.prototype[method];
							RTCPeerConnection.prototype[method] = function () {
								var args = arguments;
								if (typeof args[1] === "function" || typeof args[2] === "function") {
									return nativeMethod.apply(this, arguments).then(function () {
										if (typeof args[1] === "function") {
											args[1].apply(null);
										}
									}, function (error) {
										if (typeof args[2] === "function") {
											args[2].apply(null, [error]);
										}
									});
								}
								return nativeMethod.apply(this, arguments);
							};
						});
						["getStats"].forEach(function (method) {
							var nativeMethod = RTCPeerConnection.prototype[method];
							RTCPeerConnection.prototype[method] = function () {
								var args = arguments;
								if (typeof args[1] === "function") {
									return nativeMethod.apply(this, arguments).then(function () {
										if (typeof args[1] === "function") {
											args[1].apply(null);
										}
									});
								}
								return nativeMethod.apply(this, arguments);
							};
						});
						return RTCPeerConnection;
					};
				}, { sdp: 2 }], 2: [function (require, module, exports) {
					"use strict";
					var SDPUtils = {};
					SDPUtils.generateIdentifier = function () {
						return Math.random().toString(36).substr(2, 10);
					};
					SDPUtils.localCName = SDPUtils.generateIdentifier();
					SDPUtils.splitLines = function (blob) {
						return blob.trim().split("\n").map(function (line) {
							return line.trim();
						});
					};
					SDPUtils.splitSections = function (blob) {
						var parts = blob.split("\nm=");
						return parts.map(function (part, index) {
							return (index > 0 ? "m=" + part : part).trim() + "\r\n";
						});
					};
					SDPUtils.matchPrefix = function (blob, prefix) {
						return SDPUtils.splitLines(blob).filter(function (line) {
							return line.indexOf(prefix) === 0;
						});
					};
					SDPUtils.parseCandidate = function (line) {
						var parts;
						if (line.indexOf("a=candidate:") === 0) {
							parts = line.substring(12).split(" ");
						} else {
							parts = line.substring(10).split(" ");
						}
						var candidate = { foundation: parts[0], component: parseInt(parts[1], 10), protocol: parts[2].toLowerCase(), priority: parseInt(parts[3], 10), ip: parts[4], port: parseInt(parts[5], 10), type: parts[7] };
						for (var i = 8; i < parts.length; i += 2) {
							switch (parts[i]) {
								case "raddr":
									candidate.relatedAddress = parts[i + 1];
									break;
								case "rport":
									candidate.relatedPort = parseInt(parts[i + 1], 10);
									break;
								case "tcptype":
									candidate.tcpType = parts[i + 1];
									break;
								case "ufrag":
									candidate.ufrag = parts[i + 1];
									candidate.usernameFragment = parts[i + 1];
									break;
								default:
									candidate[parts[i]] = parts[i + 1];
									break;
							}
						}
						return candidate;
					};
					SDPUtils.writeCandidate = function (candidate) {
						var sdp = [];
						sdp.push(candidate.foundation);
						sdp.push(candidate.component);
						sdp.push(candidate.protocol.toUpperCase());
						sdp.push(candidate.priority);
						sdp.push(candidate.ip);
						sdp.push(candidate.port);
						var type = candidate.type;
						sdp.push("typ");
						sdp.push(type);
						if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
							sdp.push("raddr");
							sdp.push(candidate.relatedAddress);
							sdp.push("rport");
							sdp.push(candidate.relatedPort);
						}
						if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
							sdp.push("tcptype");
							sdp.push(candidate.tcpType);
						}
						if (candidate.ufrag) {
							sdp.push("ufrag");
							sdp.push(candidate.ufrag);
						}
						return "candidate:" + sdp.join(" ");
					};
					SDPUtils.parseIceOptions = function (line) {
						return line.substr(14).split(" ");
					};
					SDPUtils.parseRtpMap = function (line) {
						var parts = line.substr(9).split(" ");
						var parsed = { payloadType: parseInt(parts.shift(), 10) };
						parts = parts[0].split("/");
						parsed.name = parts[0];
						parsed.clockRate = parseInt(parts[1], 10);
						parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
						return parsed;
					};
					SDPUtils.writeRtpMap = function (codec) {
						var pt = codec.payloadType;
						if (codec.preferredPayloadType !== undefined) {
							pt = codec.preferredPayloadType;
						}
						return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (codec.numChannels !== 1 ? "/" + codec.numChannels : "") + "\r\n";
					};
					SDPUtils.parseExtmap = function (line) {
						var parts = line.substr(9).split(" ");
						return { id: parseInt(parts[0], 10), direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv", uri: parts[1] };
					};
					SDPUtils.writeExtmap = function (headerExtension) {
						return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + "\r\n";
					};
					SDPUtils.parseFmtp = function (line) {
						var parsed = {};
						var kv;
						var parts = line.substr(line.indexOf(" ") + 1).split(";");
						for (var j = 0; j < parts.length; j++) {
							kv = parts[j].trim().split("=");
							parsed[kv[0].trim()] = kv[1];
						}
						return parsed;
					};
					SDPUtils.writeFmtp = function (codec) {
						var line = "";
						var pt = codec.payloadType;
						if (codec.preferredPayloadType !== undefined) {
							pt = codec.preferredPayloadType;
						}
						if (codec.parameters && Object.keys(codec.parameters).length) {
							var params = [];
							Object.keys(codec.parameters).forEach(function (param) {
								params.push(param + "=" + codec.parameters[param]);
							});
							line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
						}
						return line;
					};
					SDPUtils.parseRtcpFb = function (line) {
						var parts = line.substr(line.indexOf(" ") + 1).split(" ");
						return { type: parts.shift(), parameter: parts.join(" ") };
					};
					SDPUtils.writeRtcpFb = function (codec) {
						var lines = "";
						var pt = codec.payloadType;
						if (codec.preferredPayloadType !== undefined) {
							pt = codec.preferredPayloadType;
						}
						if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
							codec.rtcpFeedback.forEach(function (fb) {
								lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
							});
						}
						return lines;
					};
					SDPUtils.parseSsrcMedia = function (line) {
						var sp = line.indexOf(" ");
						var parts = { ssrc: parseInt(line.substr(7, sp - 7), 10) };
						var colon = line.indexOf(":", sp);
						if (colon > -1) {
							parts.attribute = line.substr(sp + 1, colon - sp - 1);
							parts.value = line.substr(colon + 1);
						} else {
							parts.attribute = line.substr(sp + 1);
						}
						return parts;
					};
					SDPUtils.getMid = function (mediaSection) {
						var mid = SDPUtils.matchPrefix(mediaSection, "a=mid:")[0];
						if (mid) {
							return mid.substr(6);
						}
					};
					SDPUtils.parseFingerprint = function (line) {
						var parts = line.substr(14).split(" ");
						return { algorithm: parts[0].toLowerCase(), value: parts[1] };
					};
					SDPUtils.getDtlsParameters = function (mediaSection, sessionpart) {
						var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=fingerprint:");
						return { role: "auto", fingerprints: lines.map(SDPUtils.parseFingerprint) };
					};
					SDPUtils.writeDtlsParameters = function (params, setupType) {
						var sdp = "a=setup:" + setupType + "\r\n";
						params.fingerprints.forEach(function (fp) {
							sdp += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
						});
						return sdp;
					};
					SDPUtils.getIceParameters = function (mediaSection, sessionpart) {
						var lines = SDPUtils.splitLines(mediaSection);
						lines = lines.concat(SDPUtils.splitLines(sessionpart));
						var iceParameters = {
							usernameFragment: lines.filter(function (line) {
								return line.indexOf("a=ice-ufrag:") === 0;
							})[0].substr(12), password: lines.filter(function (line) {
								return line.indexOf("a=ice-pwd:") === 0;
							})[0].substr(10)
						};
						return iceParameters;
					};
					SDPUtils.writeIceParameters = function (params) {
						return "a=ice-ufrag:" + params.usernameFragment + "\r\n" + "a=ice-pwd:" + params.password + "\r\n";
					};
					SDPUtils.parseRtpParameters = function (mediaSection) {
						var description = { codecs: [], headerExtensions: [], fecMechanisms: [], rtcp: [] };
						var lines = SDPUtils.splitLines(mediaSection);
						var mline = lines[0].split(" ");
						for (var i = 3; i < mline.length; i++) {
							var pt = mline[i];
							var rtpmapline = SDPUtils.matchPrefix(mediaSection, "a=rtpmap:" + pt + " ")[0];
							if (rtpmapline) {
								var codec = SDPUtils.parseRtpMap(rtpmapline);
								var fmtps = SDPUtils.matchPrefix(mediaSection, "a=fmtp:" + pt + " ");
								codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
								codec.rtcpFeedback = SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:" + pt + " ").map(SDPUtils.parseRtcpFb);
								description.codecs.push(codec);
								switch (codec.name.toUpperCase()) {
									case "RED":
									case "ULPFEC":
										description.fecMechanisms.push(codec.name.toUpperCase());
										break;
									default:
										break;
								}
							}
						}
						SDPUtils.matchPrefix(mediaSection, "a=extmap:").forEach(function (line) {
							description.headerExtensions.push(SDPUtils.parseExtmap(line));
						});
						return description;
					};
					SDPUtils.writeRtpDescription = function (kind, caps) {
						var sdp = "";
						sdp += "m=" + kind + " ";
						sdp += caps.codecs.length > 0 ? "9" : "0";
						sdp += " UDP/TLS/RTP/SAVPF ";
						sdp += caps.codecs.map(function (codec) {
							if (codec.preferredPayloadType !== undefined) {
								return codec.preferredPayloadType;
							}
							return codec.payloadType;
						}).join(" ") + "\r\n";
						sdp += "c=IN IP4 0.0.0.0\r\n";
						sdp += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
						caps.codecs.forEach(function (codec) {
							sdp += SDPUtils.writeRtpMap(codec);
							sdp += SDPUtils.writeFmtp(codec);
							sdp += SDPUtils.writeRtcpFb(codec);
						});
						var maxptime = 0;
						caps.codecs.forEach(function (codec) {
							if (codec.maxptime > maxptime) {
								maxptime = codec.maxptime;
							}
						});
						if (maxptime > 0) {
							sdp += "a=maxptime:" + maxptime + "\r\n";
						}
						sdp += "a=rtcp-mux\r\n";
						caps.headerExtensions.forEach(function (extension) {
							sdp += SDPUtils.writeExtmap(extension);
						});
						return sdp;
					};
					SDPUtils.parseRtpEncodingParameters = function (mediaSection) {
						var encodingParameters = [];
						var description = SDPUtils.parseRtpParameters(mediaSection);
						var hasRed = description.fecMechanisms.indexOf("RED") !== -1;
						var hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
						var ssrcs = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function (line) {
							return SDPUtils.parseSsrcMedia(line);
						}).filter(function (parts) {
							return parts.attribute === "cname";
						});
						var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
						var secondarySsrc;
						var flows = SDPUtils.matchPrefix(mediaSection, "a=ssrc-group:FID").map(function (line) {
							var parts = line.split(" ");
							parts.shift();
							return parts.map(function (part) {
								return parseInt(part, 10);
							});
						});
						if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
							secondarySsrc = flows[0][1];
						}
						description.codecs.forEach(function (codec) {
							if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
								var encParam = { ssrc: primarySsrc, codecPayloadType: parseInt(codec.parameters.apt, 10), rtx: { ssrc: secondarySsrc } };
								encodingParameters.push(encParam);
								if (hasRed) {
									encParam = JSON.parse(JSON.stringify(encParam));
									encParam.fec = { ssrc: secondarySsrc, mechanism: hasUlpfec ? "red+ulpfec" : "red" };
									encodingParameters.push(encParam);
								}
							}
						});
						if (encodingParameters.length === 0 && primarySsrc) {
							encodingParameters.push({ ssrc: primarySsrc });
						}
						var bandwidth = SDPUtils.matchPrefix(mediaSection, "b=");
						if (bandwidth.length) {
							if (bandwidth[0].indexOf("b=TIAS:") === 0) {
								bandwidth = parseInt(bandwidth[0].substr(7), 10);
							} else if (bandwidth[0].indexOf("b=AS:") === 0) {
								bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1e3 * .95 - 50 * 40 * 8;
							} else {
								bandwidth = undefined;
							}
							encodingParameters.forEach(function (params) {
								params.maxBitrate = bandwidth;
							});
						}
						return encodingParameters;
					};
					SDPUtils.parseRtcpParameters = function (mediaSection) {
						var rtcpParameters = {};
						var cname;
						var remoteSsrc = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function (line) {
							return SDPUtils.parseSsrcMedia(line);
						}).filter(function (obj) {
							return obj.attribute === "cname";
						})[0];
						if (remoteSsrc) {
							rtcpParameters.cname = remoteSsrc.value;
							rtcpParameters.ssrc = remoteSsrc.ssrc;
						}
						var rsize = SDPUtils.matchPrefix(mediaSection, "a=rtcp-rsize");
						rtcpParameters.reducedSize = rsize.length > 0;
						rtcpParameters.compound = rsize.length === 0;
						var mux = SDPUtils.matchPrefix(mediaSection, "a=rtcp-mux");
						rtcpParameters.mux = mux.length > 0;
						return rtcpParameters;
					};
					SDPUtils.parseMsid = function (mediaSection) {
						var parts;
						var spec = SDPUtils.matchPrefix(mediaSection, "a=msid:");
						if (spec.length === 1) {
							parts = spec[0].substr(7).split(" ");
							return { stream: parts[0], track: parts[1] };
						}
						var planB = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function (line) {
							return SDPUtils.parseSsrcMedia(line);
						}).filter(function (parts) {
							return parts.attribute === "msid";
						});
						if (planB.length > 0) {
							parts = planB[0].value.split(" ");
							return { stream: parts[0], track: parts[1] };
						}
					};
					SDPUtils.generateSessionId = function () {
						return Math.random().toString().substr(2, 21);
					};
					SDPUtils.writeSessionBoilerplate = function (sessId, sessVer) {
						var sessionId;
						var version = sessVer !== undefined ? sessVer : 2;
						if (sessId) {
							sessionId = sessId;
						} else {
							sessionId = SDPUtils.generateSessionId();
						}
						return "v=0\r\n" + "o=thisisadapterortc " + sessionId + " " + version + " IN IP4 127.0.0.1\r\n" + "s=-\r\n" + "t=0 0\r\n";
					};
					SDPUtils.writeMediaSection = function (transceiver, caps, type, stream) {
						var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
						sdp += SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters());
						sdp += SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === "offer" ? "actpass" : "active");
						sdp += "a=mid:" + transceiver.mid + "\r\n";
						if (transceiver.direction) {
							sdp += "a=" + transceiver.direction + "\r\n";
						} else if (transceiver.rtpSender && transceiver.rtpReceiver) {
							sdp += "a=sendrecv\r\n";
						} else if (transceiver.rtpSender) {
							sdp += "a=sendonly\r\n";
						} else if (transceiver.rtpReceiver) {
							sdp += "a=recvonly\r\n";
						} else {
							sdp += "a=inactive\r\n";
						}
						if (transceiver.rtpSender) {
							var msid = "msid:" + stream.id + " " + transceiver.rtpSender.track.id + "\r\n";
							sdp += "a=" + msid;
							sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " " + msid;
							if (transceiver.sendEncodingParameters[0].rtx) {
								sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " " + msid;
								sdp += "a=ssrc-group:FID " + transceiver.sendEncodingParameters[0].ssrc + " " + transceiver.sendEncodingParameters[0].rtx.ssrc + "\r\n";
							}
						}
						sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " cname:" + SDPUtils.localCName + "\r\n";
						if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
							sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " cname:" + SDPUtils.localCName + "\r\n";
						}
						return sdp;
					};
					SDPUtils.getDirection = function (mediaSection, sessionpart) {
						var lines = SDPUtils.splitLines(mediaSection);
						for (var i = 0; i < lines.length; i++) {
							switch (lines[i]) {
								case "a=sendrecv":
								case "a=sendonly":
								case "a=recvonly":
								case "a=inactive":
									return lines[i].substr(2);
								default:
							}
						}
						if (sessionpart) {
							return SDPUtils.getDirection(sessionpart);
						}
						return "sendrecv";
					};
					SDPUtils.getKind = function (mediaSection) {
						var lines = SDPUtils.splitLines(mediaSection);
						var mline = lines[0].split(" ");
						return mline[0].substr(2);
					};
					SDPUtils.isRejected = function (mediaSection) {
						return mediaSection.split(" ", 2)[1] === "0";
					};
					SDPUtils.parseMLine = function (mediaSection) {
						var lines = SDPUtils.splitLines(mediaSection);
						var mline = lines[0].split(" ");
						return { kind: mline[0].substr(2), port: parseInt(mline[1], 10), protocol: mline[2], fmt: mline.slice(3).join(" ") };
					};
					if (typeof module === "object") {
						module.exports = SDPUtils;
					}
				}, {}], 3: [function (require, module, exports) {
					(function (global) {
						"use strict";
						var adapterFactory = require("./adapter_factory.js");
						module.exports = adapterFactory({ window: global.window });
					}.call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}));
				}, { "./adapter_factory.js": 4 }], 4: [function (require, module, exports) {
					"use strict";
					var utils = require("./utils");
					module.exports = function (dependencies, opts) {
						var window = dependencies && dependencies.window;
						var options = { shimChrome: true, shimFirefox: true, shimEdge: true, shimSafari: true };
						for (var key in opts) {
							if (hasOwnProperty.call(opts, key)) {
								options[key] = opts[key];
							}
						}
						var logging = utils.log;
						var browserDetails = utils.detectBrowser(window);
						var chromeShim = require("./chrome/chrome_shim") || null;
						var edgeShim = require("./edge/edge_shim") || null;
						var firefoxShim = require("./firefox/firefox_shim") || null;
						var safariShim = require("./safari/safari_shim") || null;
						var commonShim = require("./common_shim") || null;
						var adapter = { browserDetails: browserDetails, commonShim: commonShim, extractVersion: utils.extractVersion, disableLog: utils.disableLog, disableWarnings: utils.disableWarnings };
						switch (browserDetails.browser) {
							case "chrome":
								if (!chromeShim || !chromeShim.shimPeerConnection || !options.shimChrome) {
									logging("Chrome shim is not included in this adapter release.");
									return adapter;
								}
								logging("adapter.js shimming chrome.");
								adapter.browserShim = chromeShim;
								commonShim.shimCreateObjectURL(window);
								chromeShim.shimGetUserMedia(window);
								chromeShim.shimMediaStream(window);
								chromeShim.shimSourceObject(window);
								chromeShim.shimPeerConnection(window);
								chromeShim.shimOnTrack(window);
								chromeShim.shimAddTrackRemoveTrack(window);
								chromeShim.shimGetSendersWithDtmf(window);
								commonShim.shimRTCIceCandidate(window);
								commonShim.shimMaxMessageSize(window);
								commonShim.shimSendThrowTypeError(window);
								break;
							case "firefox":
								if (!firefoxShim || !firefoxShim.shimPeerConnection || !options.shimFirefox) {
									logging("Firefox shim is not included in this adapter release.");
									return adapter;
								}
								logging("adapter.js shimming firefox.");
								adapter.browserShim = firefoxShim;
								commonShim.shimCreateObjectURL(window);
								firefoxShim.shimGetUserMedia(window);
								firefoxShim.shimSourceObject(window);
								firefoxShim.shimPeerConnection(window);
								firefoxShim.shimOnTrack(window);
								firefoxShim.shimRemoveStream(window);
								commonShim.shimRTCIceCandidate(window);
								commonShim.shimMaxMessageSize(window);
								commonShim.shimSendThrowTypeError(window);
								break;
							case "edge":
								if (!edgeShim || !edgeShim.shimPeerConnection || !options.shimEdge) {
									logging("MS edge shim is not included in this adapter release.");
									return adapter;
								}
								logging("adapter.js shimming edge.");
								adapter.browserShim = edgeShim;
								commonShim.shimCreateObjectURL(window);
								edgeShim.shimGetUserMedia(window);
								edgeShim.shimPeerConnection(window);
								edgeShim.shimReplaceTrack(window);
								commonShim.shimMaxMessageSize(window);
								commonShim.shimSendThrowTypeError(window);
								break;
							case "safari":
								if (!safariShim || !options.shimSafari) {
									logging("Safari shim is not included in this adapter release.");
									return adapter;
								}
								logging("adapter.js shimming safari.");
								adapter.browserShim = safariShim;
								commonShim.shimCreateObjectURL(window);
								safariShim.shimRTCIceServerUrls(window);
								safariShim.shimCallbacksAPI(window);
								safariShim.shimLocalStreamsAPI(window);
								safariShim.shimRemoteStreamsAPI(window);
								safariShim.shimTrackEventTransceiver(window);
								safariShim.shimGetUserMedia(window);
								safariShim.shimCreateOfferLegacy(window);
								commonShim.shimRTCIceCandidate(window);
								commonShim.shimMaxMessageSize(window);
								commonShim.shimSendThrowTypeError(window);
								break;
							default:
								logging("Unsupported browser!");
								break;
						}
						return adapter;
					};
				}, { "./chrome/chrome_shim": 5, "./common_shim": 7, "./edge/edge_shim": 8, "./firefox/firefox_shim": 10, "./safari/safari_shim": 12, "./utils": 13 }], 5: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils.js");
					var logging = utils.log;
					module.exports = {
						shimGetUserMedia: require("./getusermedia"), shimMediaStream: function (window) {
							window.MediaStream = window.MediaStream || window.webkitMediaStream;
						}, shimOnTrack: function (window) {
							if (typeof window === "object" && window.RTCPeerConnection && !("ontrack" in window.RTCPeerConnection.prototype)) {
								Object.defineProperty(window.RTCPeerConnection.prototype, "ontrack", {
									get: function () {
										return this._ontrack;
									}, set: function (f) {
										if (this._ontrack) {
											this.removeEventListener("track", this._ontrack);
										}
										this.addEventListener("track", this._ontrack = f);
									}
								});
								var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;
								window.RTCPeerConnection.prototype.setRemoteDescription = function () {
									var pc = this;
									if (!pc._ontrackpoly) {
										pc._ontrackpoly = function (e) {
											e.stream.addEventListener("addtrack", function (te) {
												var receiver;
												if (window.RTCPeerConnection.prototype.getReceivers) {
													receiver = pc.getReceivers().find(function (r) {
														return r.track && r.track.id === te.track.id;
													});
												} else {
													receiver = { track: te.track };
												}
												var event = new Event("track");
												event.track = te.track;
												event.receiver = receiver;
												event.transceiver = { receiver: receiver };
												event.streams = [e.stream];
												pc.dispatchEvent(event);
											});
											e.stream.getTracks().forEach(function (track) {
												var receiver;
												if (window.RTCPeerConnection.prototype.getReceivers) {
													receiver = pc.getReceivers().find(function (r) {
														return r.track && r.track.id === track.id;
													});
												} else {
													receiver = { track: track };
												}
												var event = new Event("track");
												event.track = track;
												event.receiver = receiver;
												event.transceiver = { receiver: receiver };
												event.streams = [e.stream];
												pc.dispatchEvent(event);
											});
										};
										pc.addEventListener("addstream", pc._ontrackpoly);
									}
									return origSetRemoteDescription.apply(pc, arguments);
								};
							} else if (!("RTCRtpTransceiver" in window)) {
								utils.wrapPeerConnectionEvent(window, "track", function (e) {
									if (!e.transceiver) {
										e.transceiver = { receiver: e.receiver };
									}
									return e;
								});
							}
						}, shimGetSendersWithDtmf: function (window) {
							if (typeof window === "object" && window.RTCPeerConnection && !("getSenders" in window.RTCPeerConnection.prototype) && "createDTMFSender" in window.RTCPeerConnection.prototype) {
								var shimSenderWithDtmf = function (pc, track) {
									return {
										track: track, get dtmf() {
											if (this._dtmf === undefined) {
												if (track.kind === "audio") {
													this._dtmf = pc.createDTMFSender(track);
												} else {
													this._dtmf = null;
												}
											}
											return this._dtmf;
										}, _pc: pc
									};
								};
								if (!window.RTCPeerConnection.prototype.getSenders) {
									window.RTCPeerConnection.prototype.getSenders = function () {
										this._senders = this._senders || [];
										return this._senders.slice();
									};
									var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
									window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
										var pc = this;
										var sender = origAddTrack.apply(pc, arguments);
										if (!sender) {
											sender = shimSenderWithDtmf(pc, track);
											pc._senders.push(sender);
										}
										return sender;
									};
									var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
									window.RTCPeerConnection.prototype.removeTrack = function (sender) {
										var pc = this;
										origRemoveTrack.apply(pc, arguments);
										var idx = pc._senders.indexOf(sender);
										if (idx !== -1) {
											pc._senders.splice(idx, 1);
										}
									};
								}
								var origAddStream = window.RTCPeerConnection.prototype.addStream;
								window.RTCPeerConnection.prototype.addStream = function (stream) {
									var pc = this;
									pc._senders = pc._senders || [];
									origAddStream.apply(pc, [stream]);
									stream.getTracks().forEach(function (track) {
										pc._senders.push(shimSenderWithDtmf(pc, track));
									});
								};
								var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
								window.RTCPeerConnection.prototype.removeStream = function (stream) {
									var pc = this;
									pc._senders = pc._senders || [];
									origRemoveStream.apply(pc, [stream]);
									stream.getTracks().forEach(function (track) {
										var sender = pc._senders.find(function (s) {
											return s.track === track;
										});
										if (sender) {
											pc._senders.splice(pc._senders.indexOf(sender), 1);
										}
									});
								};
							} else if (typeof window === "object" && window.RTCPeerConnection && "getSenders" in window.RTCPeerConnection.prototype && "createDTMFSender" in window.RTCPeerConnection.prototype && window.RTCRtpSender && !("dtmf" in window.RTCRtpSender.prototype)) {
								var origGetSenders = window.RTCPeerConnection.prototype.getSenders;
								window.RTCPeerConnection.prototype.getSenders = function () {
									var pc = this;
									var senders = origGetSenders.apply(pc, []);
									senders.forEach(function (sender) {
										sender._pc = pc;
									});
									return senders;
								};
								Object.defineProperty(window.RTCRtpSender.prototype, "dtmf", {
									get: function () {
										if (this._dtmf === undefined) {
											if (this.track.kind === "audio") {
												this._dtmf = this._pc.createDTMFSender(this.track);
											} else {
												this._dtmf = null;
											}
										}
										return this._dtmf;
									}
								});
							}
						}, shimSourceObject: function (window) {
							var URL = window && window.URL;
							if (typeof window === "object") {
								if (window.HTMLMediaElement && !("srcObject" in window.HTMLMediaElement.prototype)) {
									Object.defineProperty(window.HTMLMediaElement.prototype, "srcObject", {
										get: function () {
											return this._srcObject;
										}, set: function (stream) {
											var self = this;
											this._srcObject = stream;
											if (this.src) {
												URL.revokeObjectURL(this.src);
											}
											if (!stream) {
												this.src = "";
												return undefined;
											}
											this.src = URL.createObjectURL(stream);
											stream.addEventListener("addtrack", function () {
												if (self.src) {
													URL.revokeObjectURL(self.src);
												}
												self.src = URL.createObjectURL(stream);
											});
											stream.addEventListener("removetrack", function () {
												if (self.src) {
													URL.revokeObjectURL(self.src);
												}
												self.src = URL.createObjectURL(stream);
											});
										}
									});
								}
							}
						}, shimAddTrackRemoveTrackWithNative: function (window) {
							window.RTCPeerConnection.prototype.getLocalStreams = function () {
								var pc = this;
								this._shimmedLocalStreams = this._shimmedLocalStreams || {};
								return Object.keys(this._shimmedLocalStreams).map(function (streamId) {
									return pc._shimmedLocalStreams[streamId][0];
								});
							};
							var origAddTrack = window.RTCPeerConnection.prototype.addTrack;
							window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
								if (!stream) {
									return origAddTrack.apply(this, arguments);
								}
								this._shimmedLocalStreams = this._shimmedLocalStreams || {};
								var sender = origAddTrack.apply(this, arguments);
								if (!this._shimmedLocalStreams[stream.id]) {
									this._shimmedLocalStreams[stream.id] = [stream, sender];
								} else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
									this._shimmedLocalStreams[stream.id].push(sender);
								}
								return sender;
							};
							var origAddStream = window.RTCPeerConnection.prototype.addStream;
							window.RTCPeerConnection.prototype.addStream = function (stream) {
								var pc = this;
								this._shimmedLocalStreams = this._shimmedLocalStreams || {};
								stream.getTracks().forEach(function (track) {
									var alreadyExists = pc.getSenders().find(function (s) {
										return s.track === track;
									});
									if (alreadyExists) {
										throw new DOMException("Track already exists.", "InvalidAccessError");
									}
								});
								var existingSenders = pc.getSenders();
								origAddStream.apply(this, arguments);
								var newSenders = pc.getSenders().filter(function (newSender) {
									return existingSenders.indexOf(newSender) === -1;
								});
								this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
							};
							var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
							window.RTCPeerConnection.prototype.removeStream = function (stream) {
								this._shimmedLocalStreams = this._shimmedLocalStreams || {};
								delete this._shimmedLocalStreams[stream.id];
								return origRemoveStream.apply(this, arguments);
							};
							var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
							window.RTCPeerConnection.prototype.removeTrack = function (sender) {
								var pc = this;
								this._shimmedLocalStreams = this._shimmedLocalStreams || {};
								if (sender) {
									Object.keys(this._shimmedLocalStreams).forEach(function (streamId) {
										var idx = pc._shimmedLocalStreams[streamId].indexOf(sender);
										if (idx !== -1) {
											pc._shimmedLocalStreams[streamId].splice(idx, 1);
										}
										if (pc._shimmedLocalStreams[streamId].length === 1) {
											delete pc._shimmedLocalStreams[streamId];
										}
									});
								}
								return origRemoveTrack.apply(this, arguments);
							};
						}, shimAddTrackRemoveTrack: function (window) {
							function replaceInternalStreamId(pc, description) {
								var sdp = description.sdp;
								Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
									var externalStream = pc._reverseStreams[internalId];
									var internalStream = pc._streams[externalStream.id];
									sdp = sdp.replace(new RegExp(internalStream.id, "g"), externalStream.id);
								});
								return new RTCSessionDescription({ type: description.type, sdp: sdp });
							}
							function replaceExternalStreamId(pc, description) {
								var sdp = description.sdp;
								Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
									var externalStream = pc._reverseStreams[internalId];
									var internalStream = pc._streams[externalStream.id];
									sdp = sdp.replace(new RegExp(externalStream.id, "g"), internalStream.id);
								});
								return new RTCSessionDescription({ type: description.type, sdp: sdp });
							}
							var browserDetails = utils.detectBrowser(window);
							if (window.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
								return this.shimAddTrackRemoveTrackWithNative(window);
							}
							var origGetLocalStreams = window.RTCPeerConnection.prototype.getLocalStreams;
							window.RTCPeerConnection.prototype.getLocalStreams = function () {
								var pc = this;
								var nativeStreams = origGetLocalStreams.apply(this);
								pc._reverseStreams = pc._reverseStreams || {};
								return nativeStreams.map(function (stream) {
									return pc._reverseStreams[stream.id];
								});
							};
							var origAddStream = window.RTCPeerConnection.prototype.addStream;
							window.RTCPeerConnection.prototype.addStream = function (stream) {
								var pc = this;
								pc._streams = pc._streams || {};
								pc._reverseStreams = pc._reverseStreams || {};
								stream.getTracks().forEach(function (track) {
									var alreadyExists = pc.getSenders().find(function (s) {
										return s.track === track;
									});
									if (alreadyExists) {
										throw new DOMException("Track already exists.", "InvalidAccessError");
									}
								});
								if (!pc._reverseStreams[stream.id]) {
									var newStream = new window.MediaStream(stream.getTracks());
									pc._streams[stream.id] = newStream;
									pc._reverseStreams[newStream.id] = stream;
									stream = newStream;
								}
								origAddStream.apply(pc, [stream]);
							};
							var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
							window.RTCPeerConnection.prototype.removeStream = function (stream) {
								var pc = this;
								pc._streams = pc._streams || {};
								pc._reverseStreams = pc._reverseStreams || {};
								origRemoveStream.apply(pc, [pc._streams[stream.id] || stream]);
								delete pc._reverseStreams[pc._streams[stream.id] ? pc._streams[stream.id].id : stream.id];
								delete pc._streams[stream.id];
							};
							window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
								var pc = this;
								if (pc.signalingState === "closed") {
									throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
								}
								var streams = [].slice.call(arguments, 1);
								if (streams.length !== 1 || !streams[0].getTracks().find(function (t) {
									return t === track;
								})) {
									throw new DOMException("The adapter.js addTrack polyfill only supports a single " + " stream which is associated with the specified track.", "NotSupportedError");
								}
								var alreadyExists = pc.getSenders().find(function (s) {
									return s.track === track;
								});
								if (alreadyExists) {
									throw new DOMException("Track already exists.", "InvalidAccessError");
								}
								pc._streams = pc._streams || {};
								pc._reverseStreams = pc._reverseStreams || {};
								var oldStream = pc._streams[stream.id];
								if (oldStream) {
									oldStream.addTrack(track);
									Promise.resolve().then(function () {
										pc.dispatchEvent(new Event("negotiationneeded"));
									});
								} else {
									var newStream = new window.MediaStream([track]);
									pc._streams[stream.id] = newStream;
									pc._reverseStreams[newStream.id] = stream;
									pc.addStream(newStream);
								}
								return pc.getSenders().find(function (s) {
									return s.track === track;
								});
							};
							["createOffer", "createAnswer"].forEach(function (method) {
								var nativeMethod = window.RTCPeerConnection.prototype[method];
								window.RTCPeerConnection.prototype[method] = function () {
									var pc = this;
									var args = arguments;
									var isLegacyCall = arguments.length && typeof arguments[0] === "function";
									if (isLegacyCall) {
										return nativeMethod.apply(pc, [function (description) {
											var desc = replaceInternalStreamId(pc, description);
											args[0].apply(null, [desc]);
										}, function (err) {
											if (args[1]) {
												args[1].apply(null, err);
											}
										}, arguments[2]]);
									}
									return nativeMethod.apply(pc, arguments).then(function (description) {
										return replaceInternalStreamId(pc, description);
									});
								};
							});
							var origSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;
							window.RTCPeerConnection.prototype.setLocalDescription = function () {
								var pc = this;
								if (!arguments.length || !arguments[0].type) {
									return origSetLocalDescription.apply(pc, arguments);
								}
								arguments[0] = replaceExternalStreamId(pc, arguments[0]);
								return origSetLocalDescription.apply(pc, arguments);
							};
							var origLocalDescription = Object.getOwnPropertyDescriptor(window.RTCPeerConnection.prototype, "localDescription");
							Object.defineProperty(window.RTCPeerConnection.prototype, "localDescription", {
								get: function () {
									var pc = this;
									var description = origLocalDescription.get.apply(this);
									if (description.type === "") {
										return description;
									}
									return replaceInternalStreamId(pc, description);
								}
							});
							window.RTCPeerConnection.prototype.removeTrack = function (sender) {
								var pc = this;
								if (pc.signalingState === "closed") {
									throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
								}
								if (!sender._pc) {
									throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack " + "does not implement interface RTCRtpSender.", "TypeError");
								}
								var isLocal = sender._pc === pc;
								if (!isLocal) {
									throw new DOMException("Sender was not created by this connection.", "InvalidAccessError");
								}
								pc._streams = pc._streams || {};
								var stream;
								Object.keys(pc._streams).forEach(function (streamid) {
									var hasTrack = pc._streams[streamid].getTracks().find(function (track) {
										return sender.track === track;
									});
									if (hasTrack) {
										stream = pc._streams[streamid];
									}
								});
								if (stream) {
									if (stream.getTracks().length === 1) {
										pc.removeStream(pc._reverseStreams[stream.id]);
									} else {
										stream.removeTrack(sender.track);
									}
									pc.dispatchEvent(new Event("negotiationneeded"));
								}
							};
						}, shimPeerConnection: function (window) {
							var browserDetails = utils.detectBrowser(window);
							if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
								window.RTCPeerConnection = function (pcConfig, pcConstraints) {
									logging("PeerConnection");
									if (pcConfig && pcConfig.iceTransportPolicy) {
										pcConfig.iceTransports = pcConfig.iceTransportPolicy;
									}
									return new window.webkitRTCPeerConnection(pcConfig, pcConstraints);
								};
								window.RTCPeerConnection.prototype = window.webkitRTCPeerConnection.prototype;
								if (window.webkitRTCPeerConnection.generateCertificate) {
									Object.defineProperty(window.RTCPeerConnection, "generateCertificate", {
										get: function () {
											return window.webkitRTCPeerConnection.generateCertificate;
										}
									});
								}
							} else {
								var OrigPeerConnection = window.RTCPeerConnection;
								window.RTCPeerConnection = function (pcConfig, pcConstraints) {
									if (pcConfig && pcConfig.iceServers) {
										var newIceServers = [];
										for (var i = 0; i < pcConfig.iceServers.length; i++) {
											var server = pcConfig.iceServers[i];
											if (!server.hasOwnProperty("urls") && server.hasOwnProperty("url")) {
												utils.deprecated("RTCIceServer.url", "RTCIceServer.urls");
												server = JSON.parse(JSON.stringify(server));
												server.urls = server.url;
												newIceServers.push(server);
											} else {
												newIceServers.push(pcConfig.iceServers[i]);
											}
										}
										pcConfig.iceServers = newIceServers;
									}
									return new OrigPeerConnection(pcConfig, pcConstraints);
								};
								window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
								Object.defineProperty(window.RTCPeerConnection, "generateCertificate", {
									get: function () {
										return OrigPeerConnection.generateCertificate;
									}
								});
							}
							var origGetStats = window.RTCPeerConnection.prototype.getStats;
							window.RTCPeerConnection.prototype.getStats = function (selector, successCallback, errorCallback) {
								var pc = this;
								var args = arguments;
								if (arguments.length > 0 && typeof selector === "function") {
									return origGetStats.apply(this, arguments);
								}
								if (origGetStats.length === 0 && (arguments.length === 0 || typeof arguments[0] !== "function")) {
									return origGetStats.apply(this, []);
								}
								var fixChromeStats_ = function (response) {
									var standardReport = {};
									var reports = response.result();
									reports.forEach(function (report) {
										var standardStats = { id: report.id, timestamp: report.timestamp, type: { localcandidate: "local-candidate", remotecandidate: "remote-candidate" }[report.type] || report.type };
										report.names().forEach(function (name) {
											standardStats[name] = report.stat(name);
										});
										standardReport[standardStats.id] = standardStats;
									});
									return standardReport;
								};
								var makeMapStats = function (stats) {
									return new Map(Object.keys(stats).map(function (key) {
										return [key, stats[key]];
									}));
								};
								if (arguments.length >= 2) {
									var successCallbackWrapper_ = function (response) {
										args[1](makeMapStats(fixChromeStats_(response)));
									};
									return origGetStats.apply(this, [successCallbackWrapper_, arguments[0]]);
								}
								return new Promise(function (resolve, reject) {
									origGetStats.apply(pc, [function (response) {
										resolve(makeMapStats(fixChromeStats_(response)));
									}, reject]);
								}).then(successCallback, errorCallback);
							};
							if (browserDetails.version < 51) {
								["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
									var nativeMethod = window.RTCPeerConnection.prototype[method];
									window.RTCPeerConnection.prototype[method] = function () {
										var args = arguments;
										var pc = this;
										var promise = new Promise(function (resolve, reject) {
											nativeMethod.apply(pc, [args[0], resolve, reject]);
										});
										if (args.length < 2) {
											return promise;
										}
										return promise.then(function () {
											args[1].apply(null, []);
										}, function (err) {
											if (args.length >= 3) {
												args[2].apply(null, [err]);
											}
										});
									};
								});
							}
							if (browserDetails.version < 52) {
								["createOffer", "createAnswer"].forEach(function (method) {
									var nativeMethod = window.RTCPeerConnection.prototype[method];
									window.RTCPeerConnection.prototype[method] = function () {
										var pc = this;
										if (arguments.length < 1 || arguments.length === 1 && typeof arguments[0] === "object") {
											var opts = arguments.length === 1 ? arguments[0] : undefined;
											return new Promise(function (resolve, reject) {
												nativeMethod.apply(pc, [resolve, reject, opts]);
											});
										}
										return nativeMethod.apply(this, arguments);
									};
								});
							}
							["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
								var nativeMethod = window.RTCPeerConnection.prototype[method];
								window.RTCPeerConnection.prototype[method] = function () {
									arguments[0] = new (method === "addIceCandidate" ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
									return nativeMethod.apply(this, arguments);
								};
							});
							var nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;
							window.RTCPeerConnection.prototype.addIceCandidate = function () {
								if (!arguments[0]) {
									if (arguments[1]) {
										arguments[1].apply(null);
									}
									return Promise.resolve();
								}
								return nativeAddIceCandidate.apply(this, arguments);
							};
						}
					};
				}, { "../utils.js": 13, "./getusermedia": 6 }], 6: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils.js");
					var logging = utils.log;
					module.exports = function (window) {
						var browserDetails = utils.detectBrowser(window);
						var navigator = window && window.navigator;
						var constraintsToChrome_ = function (c) {
							if (typeof c !== "object" || c.mandatory || c.optional) {
								return c;
							}
							var cc = {};
							Object.keys(c).forEach(function (key) {
								if (key === "require" || key === "advanced" || key === "mediaSource") {
									return;
								}
								var r = typeof c[key] === "object" ? c[key] : { ideal: c[key] };
								if (r.exact !== undefined && typeof r.exact === "number") {
									r.min = r.max = r.exact;
								}
								var oldname_ = function (prefix, name) {
									if (prefix) {
										return prefix + name.charAt(0).toUpperCase() + name.slice(1);
									}
									if (name === "deviceId") {
										return "sourceId";
									} else {
										return name;
									}
								};
								if (r.ideal !== undefined) {
									cc.optional = cc.optional || [];
									var oc = {};
									if (typeof r.ideal === "number") {
										oc[oldname_("min", key)] = r.ideal;
										cc.optional.push(oc);
										oc = {};
										oc[oldname_("max", key)] = r.ideal;
										cc.optional.push(oc);
									} else {
										oc[oldname_("", key)] = r.ideal;
										cc.optional.push(oc);
									}
								}
								if (r.exact !== undefined && typeof r.exact !== "number") {
									cc.mandatory = cc.mandatory || {};
									cc.mandatory[oldname_("", key)] = r.exact;
								} else {
									["min", "max"].forEach(function (mix) {
										if (r[mix] !== undefined) {
											cc.mandatory = cc.mandatory || {};
											cc.mandatory[oldname_(mix, key)] = r[mix];
										}
									});
								}
							});
							if (c.advanced) {
								cc.optional = (cc.optional || []).concat(c.advanced);
							}
							return cc;
						};
						var shimConstraints_ = function (constraints, func) {
							if (browserDetails.version >= 61) {
								return func(constraints);
							}
							constraints = JSON.parse(JSON.stringify(constraints));
							if (constraints && typeof constraints.audio === "object") {
								var remap = function (obj, a, b) {
									if (a in obj && !(b in obj)) {
										obj[b] = obj[a];
										delete obj[a];
									}
								};
								constraints = JSON.parse(JSON.stringify(constraints));
								remap(constraints.audio, "autoGainControl", "googAutoGainControl");
								remap(constraints.audio, "noiseSuppression", "googNoiseSuppression");
								constraints.audio = constraintsToChrome_(constraints.audio);
							}
							if (constraints && typeof constraints.video === "object") {
								var face = constraints.video.facingMode;
								face = face && (typeof face === "object" ? face : { ideal: face });
								var getSupportedFacingModeLies = browserDetails.version < 66;
								if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && (!navigator.mediaDevices.getSupportedConstraints || !navigator.mediaDevices.getSupportedConstraints().facingMode || !!getSupportedFacingModeLies)) {
									delete constraints.video.facingMode;
									var matches;
									if (face.exact === "environment" || face.ideal === "environment") {
										matches = ["back", "rear"];
									} else if (face.exact === "user" || face.ideal === "user") {
										matches = ["front"];
									}
									if (matches) {
										return navigator.mediaDevices.enumerateDevices().then(function (devices) {
											devices = devices.filter(function (d) {
												return d.kind === "videoinput";
											});
											var dev = devices.find(function (d) {
												return matches.some(function (match) {
													return d.label.toLowerCase().indexOf(match) !== -1;
												});
											});
											if (!dev && devices.length && matches.indexOf("back") !== -1) {
												dev = devices[devices.length - 1];
											}
											if (dev) {
												constraints.video.deviceId = face.exact ? { exact: dev.deviceId } : { ideal: dev.deviceId };
											}
											constraints.video = constraintsToChrome_(constraints.video);
											logging("chrome: " + JSON.stringify(constraints));
											return func(constraints);
										});
									}
								}
								constraints.video = constraintsToChrome_(constraints.video);
							}
							logging("chrome: " + JSON.stringify(constraints));
							return func(constraints);
						};
						var shimError_ = function (e) {
							return {
								name: { PermissionDeniedError: "NotAllowedError", InvalidStateError: "NotReadableError", DevicesNotFoundError: "NotFoundError", ConstraintNotSatisfiedError: "OverconstrainedError", TrackStartError: "NotReadableError", MediaDeviceFailedDueToShutdown: "NotReadableError", MediaDeviceKillSwitchOn: "NotReadableError" }[e.name] || e.name, message: e.message, constraint: e.constraintName, toString: function () {
									return this.name + (this.message && ": ") + this.message;
								}
							};
						};
						var getUserMedia_ = function (constraints, onSuccess, onError) {
							shimConstraints_(constraints, function (c) {
								navigator.webkitGetUserMedia(c, onSuccess, function (e) {
									if (onError) {
										onError(shimError_(e));
									}
								});
							});
						};
						navigator.getUserMedia = getUserMedia_;
						var getUserMediaPromise_ = function (constraints) {
							return new Promise(function (resolve, reject) {
								navigator.getUserMedia(constraints, resolve, reject);
							});
						};
						if (!navigator.mediaDevices) {
							navigator.mediaDevices = {
								getUserMedia: getUserMediaPromise_, enumerateDevices: function () {
									return new Promise(function (resolve) {
										var kinds = { audio: "audioinput", video: "videoinput" };
										return window.MediaStreamTrack.getSources(function (devices) {
											resolve(devices.map(function (device) {
												return { label: device.label, kind: kinds[device.kind], deviceId: device.id, groupId: "" };
											}));
										});
									});
								}, getSupportedConstraints: function () {
									return { deviceId: true, echoCancellation: true, facingMode: true, frameRate: true, height: true, width: true };
								}
							};
						}
						if (!navigator.mediaDevices.getUserMedia) {
							navigator.mediaDevices.getUserMedia = function (constraints) {
								return getUserMediaPromise_(constraints);
							};
						} else {
							var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
							navigator.mediaDevices.getUserMedia = function (cs) {
								return shimConstraints_(cs, function (c) {
									return origGetUserMedia(c).then(function (stream) {
										if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
											stream.getTracks().forEach(function (track) {
												track.stop();
											});
											throw new DOMException("", "NotFoundError");
										}
										return stream;
									}, function (e) {
										return Promise.reject(shimError_(e));
									});
								});
							};
						}
						if (typeof navigator.mediaDevices.addEventListener === "undefined") {
							navigator.mediaDevices.addEventListener = function () {
								logging("Dummy mediaDevices.addEventListener called.");
							};
						}
						if (typeof navigator.mediaDevices.removeEventListener === "undefined") {
							navigator.mediaDevices.removeEventListener = function () {
								logging("Dummy mediaDevices.removeEventListener called.");
							};
						}
					};
				}, { "../utils.js": 13 }], 7: [function (require, module, exports) {
					"use strict";
					var SDPUtils = require("sdp");
					var utils = require("./utils");
					module.exports = {
						shimRTCIceCandidate: function (window) {
							if (window.RTCIceCandidate && "foundation" in window.RTCIceCandidate.prototype) {
								return;
							}
							var NativeRTCIceCandidate = window.RTCIceCandidate;
							window.RTCIceCandidate = function (args) {
								if (typeof args === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
									args = JSON.parse(JSON.stringify(args));
									args.candidate = args.candidate.substr(2);
								}
								var nativeCandidate = new NativeRTCIceCandidate(args);
								var parsedCandidate = SDPUtils.parseCandidate(args.candidate);
								var augmentedCandidate = Object.assign(nativeCandidate, parsedCandidate);
								augmentedCandidate.toJSON = function () {
									return { candidate: augmentedCandidate.candidate, sdpMid: augmentedCandidate.sdpMid, sdpMLineIndex: augmentedCandidate.sdpMLineIndex, usernameFragment: augmentedCandidate.usernameFragment };
								};
								return augmentedCandidate;
							};
							utils.wrapPeerConnectionEvent(window, "icecandidate", function (e) {
								if (e.candidate) {
									Object.defineProperty(e, "candidate", { value: new window.RTCIceCandidate(e.candidate), writable: "false" });
								}
								return e;
							});
						}, shimCreateObjectURL: function (window) {
							var URL = window && window.URL;
							if (typeof window !== "object" || !window.HTMLMediaElement || !("srcObject" in window.HTMLMediaElement.prototype) || !URL.createObjectURL || !URL.revokeObjectURL) {
								return undefined;
							}
							var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
							var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
							var streams = new Map;
							var newId = 0;
							URL.createObjectURL = function (stream) {
								if ("getTracks" in stream) {
									var url = "polyblob:" + ++newId;
									streams.set(url, stream);
									utils.deprecated("URL.createObjectURL(stream)", "elem.srcObject = stream");
									return url;
								}
								return nativeCreateObjectURL(stream);
							};
							URL.revokeObjectURL = function (url) {
								nativeRevokeObjectURL(url);
								streams.delete(url);
							};
							var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "src");
							Object.defineProperty(window.HTMLMediaElement.prototype, "src", {
								get: function () {
									return dsc.get.apply(this);
								}, set: function (url) {
									this.srcObject = streams.get(url) || null;
									return dsc.set.apply(this, [url]);
								}
							});
							var nativeSetAttribute = window.HTMLMediaElement.prototype.setAttribute;
							window.HTMLMediaElement.prototype.setAttribute = function () {
								if (arguments.length === 2 && ("" + arguments[0]).toLowerCase() === "src") {
									this.srcObject = streams.get(arguments[1]) || null;
								}
								return nativeSetAttribute.apply(this, arguments);
							};
						}, shimMaxMessageSize: function (window) {
							if (window.RTCSctpTransport || !window.RTCPeerConnection) {
								return;
							}
							var browserDetails = utils.detectBrowser(window);
							if (!("sctp" in window.RTCPeerConnection.prototype)) {
								Object.defineProperty(window.RTCPeerConnection.prototype, "sctp", {
									get: function () {
										if (typeof this._sctp === "undefined") {
											return null;
										} else {
											return this._sctp;
										}
									}
								});
							}
							var sctpInDescription = function (description) {
								var sections = SDPUtils.splitSections(description.sdp);
								sections.shift();
								return sections.some(function (mediaSection) {
									var mLine = SDPUtils.parseMLine(mediaSection);
									return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
								});
							};
							var getRemoteFirefoxVersion = function (description) {
								var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
								if (match === null || match.length < 2) {
									return -1;
								}
								var version = parseInt(match[1], 10);
								if (version === version) {
									return version;
								} else {
									return -1;
								}
							};
							var getCanSendMaxMessageSize = function (remoteIsFirefox) {
								var canSendMaxMessageSize = 65536;
								if (browserDetails.browser === "firefox") {
									if (browserDetails.version < 57) {
										if (remoteIsFirefox === -1) {
											canSendMaxMessageSize = 16384;
										} else {
											canSendMaxMessageSize = 2147483637;
										}
									} else {
										canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
									}
								}
								return canSendMaxMessageSize;
							};
							var getMaxMessageSize = function (description, remoteIsFirefox) {
								var maxMessageSize = 65536;
								if (browserDetails.browser === "firefox" && browserDetails.version === 57) {
									maxMessageSize = 65535;
								}
								var match = SDPUtils.matchPrefix(description.sdp, "a=max-message-size:");
								if (match.length > 0) {
									maxMessageSize = parseInt(match[0].substr(19), 10);
								} else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1) {
									maxMessageSize = 2147483637;
								}
								return maxMessageSize;
							};
							var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;
							window.RTCPeerConnection.prototype.setRemoteDescription = function () {
								var pc = this;
								pc._sctp = null;
								if (sctpInDescription(arguments[0])) {
									var isFirefox = getRemoteFirefoxVersion(arguments[0]);
									var canSendMMS = getCanSendMaxMessageSize(isFirefox);
									var remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
									var maxMessageSize;
									if (canSendMMS === 0 && remoteMMS === 0) {
										maxMessageSize = Number.POSITIVE_INFINITY;
									} else if (canSendMMS === 0 || remoteMMS === 0) {
										maxMessageSize = Math.max(canSendMMS, remoteMMS);
									} else {
										maxMessageSize = Math.min(canSendMMS, remoteMMS);
									}
									var sctp = {};
									Object.defineProperty(sctp, "maxMessageSize", {
										get: function () {
											return maxMessageSize;
										}
									});
									pc._sctp = sctp;
								}
								return origSetRemoteDescription.apply(pc, arguments);
							};
						}, shimSendThrowTypeError: function (window) {
							var origCreateDataChannel = window.RTCPeerConnection.prototype.createDataChannel;
							window.RTCPeerConnection.prototype.createDataChannel = function () {
								var pc = this;
								var dataChannel = origCreateDataChannel.apply(pc, arguments);
								var origDataChannelSend = dataChannel.send;
								dataChannel.send = function () {
									var dc = this;
									var data = arguments[0];
									var length = data.length || data.size || data.byteLength;
									if (length > pc.sctp.maxMessageSize) {
										throw new DOMException("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)", "TypeError");
									}
									return origDataChannelSend.apply(dc, arguments);
								};
								return dataChannel;
							};
						}
					};
				}, { "./utils": 13, sdp: 2 }], 8: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils");
					var shimRTCPeerConnection = require("rtcpeerconnection-shim");
					module.exports = {
						shimGetUserMedia: require("./getusermedia"), shimPeerConnection: function (window) {
							var browserDetails = utils.detectBrowser(window);
							if (window.RTCIceGatherer) {
								if (!window.RTCIceCandidate) {
									window.RTCIceCandidate = function (args) {
										return args;
									};
								}
								if (!window.RTCSessionDescription) {
									window.RTCSessionDescription = function (args) {
										return args;
									};
								}
								if (browserDetails.version < 15025) {
									var origMSTEnabled = Object.getOwnPropertyDescriptor(window.MediaStreamTrack.prototype, "enabled");
									Object.defineProperty(window.MediaStreamTrack.prototype, "enabled", {
										set: function (value) {
											origMSTEnabled.set.call(this, value);
											var ev = new Event("enabled");
											ev.enabled = value;
											this.dispatchEvent(ev);
										}
									});
								}
							}
							if (window.RTCRtpSender && !("dtmf" in window.RTCRtpSender.prototype)) {
								Object.defineProperty(window.RTCRtpSender.prototype, "dtmf", {
									get: function () {
										if (this._dtmf === undefined) {
											if (this.track.kind === "audio") {
												this._dtmf = new window.RTCDtmfSender(this);
											} else if (this.track.kind === "video") {
												this._dtmf = null;
											}
										}
										return this._dtmf;
									}
								});
							}
							window.RTCPeerConnection = shimRTCPeerConnection(window, browserDetails.version);
						}, shimReplaceTrack: function (window) {
							if (window.RTCRtpSender && !("replaceTrack" in window.RTCRtpSender.prototype)) {
								window.RTCRtpSender.prototype.replaceTrack = window.RTCRtpSender.prototype.setTrack;
							}
						}
					};
				}, { "../utils": 13, "./getusermedia": 9, "rtcpeerconnection-shim": 1 }], 9: [function (require, module, exports) {
					"use strict";
					module.exports = function (window) {
						var navigator = window && window.navigator;
						var shimError_ = function (e) {
							return {
								name: { PermissionDeniedError: "NotAllowedError" }[e.name] || e.name, message: e.message, constraint: e.constraint, toString: function () {
									return this.name;
								}
							};
						};
						var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
						navigator.mediaDevices.getUserMedia = function (c) {
							return origGetUserMedia(c).catch(function (e) {
								return Promise.reject(shimError_(e));
							});
						};
					};
				}, {}], 10: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils");
					module.exports = {
						shimGetUserMedia: require("./getusermedia"), shimOnTrack: function (window) {
							if (typeof window === "object" && window.RTCPeerConnection && !("ontrack" in window.RTCPeerConnection.prototype)) {
								Object.defineProperty(window.RTCPeerConnection.prototype, "ontrack", {
									get: function () {
										return this._ontrack;
									}, set: function (f) {
										if (this._ontrack) {
											this.removeEventListener("track", this._ontrack);
											this.removeEventListener("addstream", this._ontrackpoly);
										}
										this.addEventListener("track", this._ontrack = f);
										this.addEventListener("addstream", this._ontrackpoly = function (e) {
											e.stream.getTracks().forEach(function (track) {
												var event = new Event("track");
												event.track = track;
												event.receiver = { track: track };
												event.transceiver = { receiver: event.receiver };
												event.streams = [e.stream];
												this.dispatchEvent(event);
											}.bind(this));
										}.bind(this));
									}
								});
							}
							if (typeof window === "object" && window.RTCTrackEvent && "receiver" in window.RTCTrackEvent.prototype && !("transceiver" in window.RTCTrackEvent.prototype)) {
								Object.defineProperty(window.RTCTrackEvent.prototype, "transceiver", {
									get: function () {
										return { receiver: this.receiver };
									}
								});
							}
						}, shimSourceObject: function (window) {
							if (typeof window === "object") {
								if (window.HTMLMediaElement && !("srcObject" in window.HTMLMediaElement.prototype)) {
									Object.defineProperty(window.HTMLMediaElement.prototype, "srcObject", {
										get: function () {
											return this.mozSrcObject;
										}, set: function (stream) {
											this.mozSrcObject = stream;
										}
									});
								}
							}
						}, shimPeerConnection: function (window) {
							var browserDetails = utils.detectBrowser(window);
							if (typeof window !== "object" || !window.RTCPeerConnection && !window.mozRTCPeerConnection) {
								return;
							}
							if (!window.RTCPeerConnection) {
								window.RTCPeerConnection = function (pcConfig, pcConstraints) {
									if (browserDetails.version < 38) {
										if (pcConfig && pcConfig.iceServers) {
											var newIceServers = [];
											for (var i = 0; i < pcConfig.iceServers.length; i++) {
												var server = pcConfig.iceServers[i];
												if (server.hasOwnProperty("urls")) {
													for (var j = 0; j < server.urls.length; j++) {
														var newServer = { url: server.urls[j] };
														if (server.urls[j].indexOf("turn") === 0) {
															newServer.username = server.username;
															newServer.credential = server.credential;
														}
														newIceServers.push(newServer);
													}
												} else {
													newIceServers.push(pcConfig.iceServers[i]);
												}
											}
											pcConfig.iceServers = newIceServers;
										}
									}
									return new window.mozRTCPeerConnection(pcConfig, pcConstraints);
								};
								window.RTCPeerConnection.prototype = window.mozRTCPeerConnection.prototype;
								if (window.mozRTCPeerConnection.generateCertificate) {
									Object.defineProperty(window.RTCPeerConnection, "generateCertificate", {
										get: function () {
											return window.mozRTCPeerConnection.generateCertificate;
										}
									});
								}
								window.RTCSessionDescription = window.mozRTCSessionDescription;
								window.RTCIceCandidate = window.mozRTCIceCandidate;
							}
							["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function (method) {
								var nativeMethod = window.RTCPeerConnection.prototype[method];
								window.RTCPeerConnection.prototype[method] = function () {
									arguments[0] = new (method === "addIceCandidate" ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
									return nativeMethod.apply(this, arguments);
								};
							});
							var nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;
							window.RTCPeerConnection.prototype.addIceCandidate = function () {
								if (!arguments[0]) {
									if (arguments[1]) {
										arguments[1].apply(null);
									}
									return Promise.resolve();
								}
								return nativeAddIceCandidate.apply(this, arguments);
							};
							var makeMapStats = function (stats) {
								var map = new Map;
								Object.keys(stats).forEach(function (key) {
									map.set(key, stats[key]);
									map[key] = stats[key];
								});
								return map;
							};
							var modernStatsTypes = { inboundrtp: "inbound-rtp", outboundrtp: "outbound-rtp", candidatepair: "candidate-pair", localcandidate: "local-candidate", remotecandidate: "remote-candidate" };
							var nativeGetStats = window.RTCPeerConnection.prototype.getStats;
							window.RTCPeerConnection.prototype.getStats = function (selector, onSucc, onErr) {
								return nativeGetStats.apply(this, [selector || null]).then(function (stats) {
									if (browserDetails.version < 48) {
										stats = makeMapStats(stats);
									}
									if (browserDetails.version < 53 && !onSucc) {
										try {
											stats.forEach(function (stat) {
												stat.type = modernStatsTypes[stat.type] || stat.type;
											});
										} catch (e) {
											if (e.name !== "TypeError") {
												throw e;
											}
											stats.forEach(function (stat, i) {
												stats.set(i, Object.assign({}, stat, { type: modernStatsTypes[stat.type] || stat.type }));
											});
										}
									}
									return stats;
								}).then(onSucc, onErr);
							};
						}, shimRemoveStream: function (window) {
							if (!window.RTCPeerConnection || "removeStream" in window.RTCPeerConnection.prototype) {
								return;
							}
							window.RTCPeerConnection.prototype.removeStream = function (stream) {
								var pc = this;
								utils.deprecated("removeStream", "removeTrack");
								this.getSenders().forEach(function (sender) {
									if (sender.track && stream.getTracks().indexOf(sender.track) !== -1) {
										pc.removeTrack(sender);
									}
								});
							};
						}
					};
				}, { "../utils": 13, "./getusermedia": 11 }], 11: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils");
					var logging = utils.log;
					module.exports = function (window) {
						var browserDetails = utils.detectBrowser(window);
						var navigator = window && window.navigator;
						var MediaStreamTrack = window && window.MediaStreamTrack;
						var shimError_ = function (e) {
							return {
								name: { InternalError: "NotReadableError", NotSupportedError: "TypeError", PermissionDeniedError: "NotAllowedError", SecurityError: "NotAllowedError" }[e.name] || e.name, message: { "The operation is insecure.": "The request is not allowed by the " + "user agent or the platform in the current context." }[e.message] || e.message, constraint: e.constraint, toString: function () {
									return this.name + (this.message && ": ") + this.message;
								}
							};
						};
						var getUserMedia_ = function (constraints, onSuccess, onError) {
							var constraintsToFF37_ = function (c) {
								if (typeof c !== "object" || c.require) {
									return c;
								}
								var require = [];
								Object.keys(c).forEach(function (key) {
									if (key === "require" || key === "advanced" || key === "mediaSource") {
										return;
									}
									var r = c[key] = typeof c[key] === "object" ? c[key] : { ideal: c[key] };
									if (r.min !== undefined || r.max !== undefined || r.exact !== undefined) {
										require.push(key);
									}
									if (r.exact !== undefined) {
										if (typeof r.exact === "number") {
											r.min = r.max = r.exact;
										} else {
											c[key] = r.exact;
										}
										delete r.exact;
									}
									if (r.ideal !== undefined) {
										c.advanced = c.advanced || [];
										var oc = {};
										if (typeof r.ideal === "number") {
											oc[key] = { min: r.ideal, max: r.ideal };
										} else {
											oc[key] = r.ideal;
										}
										c.advanced.push(oc);
										delete r.ideal;
										if (!Object.keys(r).length) {
											delete c[key];
										}
									}
								});
								if (require.length) {
									c.require = require;
								}
								return c;
							};
							constraints = JSON.parse(JSON.stringify(constraints));
							if (browserDetails.version < 38) {
								logging("spec: " + JSON.stringify(constraints));
								if (constraints.audio) {
									constraints.audio = constraintsToFF37_(constraints.audio);
								}
								if (constraints.video) {
									constraints.video = constraintsToFF37_(constraints.video);
								}
								logging("ff37: " + JSON.stringify(constraints));
							}
							return navigator.mozGetUserMedia(constraints, onSuccess, function (e) {
								onError(shimError_(e));
							});
						};
						var getUserMediaPromise_ = function (constraints) {
							return new Promise(function (resolve, reject) {
								getUserMedia_(constraints, resolve, reject);
							});
						};
						if (!navigator.mediaDevices) {
							navigator.mediaDevices = { getUserMedia: getUserMediaPromise_, addEventListener: function () { }, removeEventListener: function () { } };
						}
						navigator.mediaDevices.enumerateDevices = navigator.mediaDevices.enumerateDevices || function () {
							return new Promise(function (resolve) {
								var infos = [{ kind: "audioinput", deviceId: "default", label: "", groupId: "" }, { kind: "videoinput", deviceId: "default", label: "", groupId: "" }];
								resolve(infos);
							});
						};
						if (browserDetails.version < 41) {
							var orgEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
							navigator.mediaDevices.enumerateDevices = function () {
								return orgEnumerateDevices().then(undefined, function (e) {
									if (e.name === "NotFoundError") {
										return [];
									}
									throw e;
								});
							};
						}
						if (browserDetails.version < 49) {
							var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
							navigator.mediaDevices.getUserMedia = function (c) {
								return origGetUserMedia(c).then(function (stream) {
									if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
										stream.getTracks().forEach(function (track) {
											track.stop();
										});
										throw new DOMException("The object can not be found here.", "NotFoundError");
									}
									return stream;
								}, function (e) {
									return Promise.reject(shimError_(e));
								});
							};
						}
						if (!(browserDetails.version > 55) || !("autoGainControl" in navigator.mediaDevices.getSupportedConstraints())) {
							var remap = function (obj, a, b) {
								if (a in obj && !(b in obj)) {
									obj[b] = obj[a];
									delete obj[a];
								}
							};
							var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
							navigator.mediaDevices.getUserMedia = function (c) {
								if (typeof c === "object" && typeof c.audio === "object") {
									c = JSON.parse(JSON.stringify(c));
									remap(c.audio, "autoGainControl", "mozAutoGainControl");
									remap(c.audio, "noiseSuppression", "mozNoiseSuppression");
								}
								return nativeGetUserMedia(c);
							};
							if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
								var nativeGetSettings = MediaStreamTrack.prototype.getSettings;
								MediaStreamTrack.prototype.getSettings = function () {
									var obj = nativeGetSettings.apply(this, arguments);
									remap(obj, "mozAutoGainControl", "autoGainControl");
									remap(obj, "mozNoiseSuppression", "noiseSuppression");
									return obj;
								};
							}
							if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
								var nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
								MediaStreamTrack.prototype.applyConstraints = function (c) {
									if (this.kind === "audio" && typeof c === "object") {
										c = JSON.parse(JSON.stringify(c));
										remap(c, "autoGainControl", "mozAutoGainControl");
										remap(c, "noiseSuppression", "mozNoiseSuppression");
									}
									return nativeApplyConstraints.apply(this, [c]);
								};
							}
						}
						navigator.getUserMedia = function (constraints, onSuccess, onError) {
							if (browserDetails.version < 44) {
								return getUserMedia_(constraints, onSuccess, onError);
							}
							utils.deprecated("navigator.getUserMedia", "navigator.mediaDevices.getUserMedia");
							navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
						};
					};
				}, { "../utils": 13 }], 12: [function (require, module, exports) {
					"use strict";
					var utils = require("../utils");
					module.exports = {
						shimLocalStreamsAPI: function (window) {
							if (typeof window !== "object" || !window.RTCPeerConnection) {
								return;
							}
							if (!("getLocalStreams" in window.RTCPeerConnection.prototype)) {
								window.RTCPeerConnection.prototype.getLocalStreams = function () {
									if (!this._localStreams) {
										this._localStreams = [];
									}
									return this._localStreams;
								};
							}
							if (!("getStreamById" in window.RTCPeerConnection.prototype)) {
								window.RTCPeerConnection.prototype.getStreamById = function (id) {
									var result = null;
									if (this._localStreams) {
										this._localStreams.forEach(function (stream) {
											if (stream.id === id) {
												result = stream;
											}
										});
									}
									if (this._remoteStreams) {
										this._remoteStreams.forEach(function (stream) {
											if (stream.id === id) {
												result = stream;
											}
										});
									}
									return result;
								};
							}
							if (!("addStream" in window.RTCPeerConnection.prototype)) {
								var _addTrack = window.RTCPeerConnection.prototype.addTrack;
								window.RTCPeerConnection.prototype.addStream = function (stream) {
									if (!this._localStreams) {
										this._localStreams = [];
									}
									if (this._localStreams.indexOf(stream) === -1) {
										this._localStreams.push(stream);
									}
									var pc = this;
									stream.getTracks().forEach(function (track) {
										_addTrack.call(pc, track, stream);
									});
								};
								window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
									if (stream) {
										if (!this._localStreams) {
											this._localStreams = [stream];
										} else if (this._localStreams.indexOf(stream) === -1) {
											this._localStreams.push(stream);
										}
									}
									return _addTrack.call(this, track, stream);
								};
							}
							if (!("removeStream" in window.RTCPeerConnection.prototype)) {
								window.RTCPeerConnection.prototype.removeStream = function (stream) {
									if (!this._localStreams) {
										this._localStreams = [];
									}
									var index = this._localStreams.indexOf(stream);
									if (index === -1) {
										return;
									}
									this._localStreams.splice(index, 1);
									var pc = this;
									var tracks = stream.getTracks();
									this.getSenders().forEach(function (sender) {
										if (tracks.indexOf(sender.track) !== -1) {
											pc.removeTrack(sender);
										}
									});
								};
							}
						}, shimRemoteStreamsAPI: function (window) {
							if (typeof window !== "object" || !window.RTCPeerConnection) {
								return;
							}
							if (!("getRemoteStreams" in window.RTCPeerConnection.prototype)) {
								window.RTCPeerConnection.prototype.getRemoteStreams = function () {
									if (this._remoteStreams) {
										return this._remoteStreams;
									} else {
										return [];
									}
								};
							}
							if (!("onaddstream" in window.RTCPeerConnection.prototype)) {
								Object.defineProperty(window.RTCPeerConnection.prototype, "onaddstream", {
									get: function () {
										return this._onaddstream;
									}, set: function (f) {
										var pc = this;
										if (this._onaddstream) {
											this.removeEventListener("addstream", this._onaddstream);
											this.removeEventListener("track", this._onaddstreampoly);
										}
										this.addEventListener("addstream", this._onaddstream = f);
										this.addEventListener("track", this._onaddstreampoly = function (e) {
											e.streams.forEach(function (stream) {
												if (!pc._remoteStreams) {
													pc._remoteStreams = [];
												}
												if (pc._remoteStreams.indexOf(stream) >= 0) {
													return;
												}
												pc._remoteStreams.push(stream);
												var event = new Event("addstream");
												event.stream = stream;
												pc.dispatchEvent(event);
											});
										});
									}
								});
							}
						}, shimCallbacksAPI: function (window) {
							if (typeof window !== "object" || !window.RTCPeerConnection) {
								return;
							}
							var prototype = window.RTCPeerConnection.prototype;
							var createOffer = prototype.createOffer;
							var createAnswer = prototype.createAnswer;
							var setLocalDescription = prototype.setLocalDescription;
							var setRemoteDescription = prototype.setRemoteDescription;
							var addIceCandidate = prototype.addIceCandidate;
							prototype.createOffer = function (successCallback, failureCallback) {
								var options = arguments.length >= 2 ? arguments[2] : arguments[0];
								var promise = createOffer.apply(this, [options]);
								if (!failureCallback) {
									return promise;
								}
								promise.then(successCallback, failureCallback);
								return Promise.resolve();
							};
							prototype.createAnswer = function (successCallback, failureCallback) {
								var options = arguments.length >= 2 ? arguments[2] : arguments[0];
								var promise = createAnswer.apply(this, [options]);
								if (!failureCallback) {
									return promise;
								}
								promise.then(successCallback, failureCallback);
								return Promise.resolve();
							};
							var withCallback = function (description, successCallback, failureCallback) {
								var promise = setLocalDescription.apply(this, [description]);
								if (!failureCallback) {
									return promise;
								}
								promise.then(successCallback, failureCallback);
								return Promise.resolve();
							};
							prototype.setLocalDescription = withCallback;
							withCallback = function (description, successCallback, failureCallback) {
								var promise = setRemoteDescription.apply(this, [description]);
								if (!failureCallback) {
									return promise;
								}
								promise.then(successCallback, failureCallback);
								return Promise.resolve();
							};
							prototype.setRemoteDescription = withCallback;
							withCallback = function (candidate, successCallback, failureCallback) {
								var promise = addIceCandidate.apply(this, [candidate]);
								if (!failureCallback) {
									return promise;
								}
								promise.then(successCallback, failureCallback);
								return Promise.resolve();
							};
							prototype.addIceCandidate = withCallback;
						}, shimGetUserMedia: function (window) {
							var navigator = window && window.navigator;
							if (!navigator.getUserMedia) {
								if (navigator.webkitGetUserMedia) {
									navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
								} else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
									navigator.getUserMedia = function (constraints, cb, errcb) {
										navigator.mediaDevices.getUserMedia(constraints).then(cb, errcb);
									}.bind(navigator);
								}
							}
						}, shimRTCIceServerUrls: function (window) {
							var OrigPeerConnection = window.RTCPeerConnection;
							window.RTCPeerConnection = function (pcConfig, pcConstraints) {
								if (pcConfig && pcConfig.iceServers) {
									var newIceServers = [];
									for (var i = 0; i < pcConfig.iceServers.length; i++) {
										var server = pcConfig.iceServers[i];
										if (!server.hasOwnProperty("urls") && server.hasOwnProperty("url")) {
											utils.deprecated("RTCIceServer.url", "RTCIceServer.urls");
											server = JSON.parse(JSON.stringify(server));
											server.urls = server.url;
											delete server.url;
											newIceServers.push(server);
										} else {
											newIceServers.push(pcConfig.iceServers[i]);
										}
									}
									pcConfig.iceServers = newIceServers;
								}
								return new OrigPeerConnection(pcConfig, pcConstraints);
							};
							window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
							if ("generateCertificate" in window.RTCPeerConnection) {
								Object.defineProperty(window.RTCPeerConnection, "generateCertificate", {
									get: function () {
										return OrigPeerConnection.generateCertificate;
									}
								});
							}
						}, shimTrackEventTransceiver: function (window) {
							if (typeof window === "object" && window.RTCPeerConnection && "receiver" in window.RTCTrackEvent.prototype && !window.RTCTransceiver) {
								Object.defineProperty(window.RTCTrackEvent.prototype, "transceiver", {
									get: function () {
										return { receiver: this.receiver };
									}
								});
							}
						}, shimCreateOfferLegacy: function (window) {
							var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
							window.RTCPeerConnection.prototype.createOffer = function (offerOptions) {
								var pc = this;
								if (offerOptions) {
									var audioTransceiver = pc.getTransceivers().find(function (transceiver) {
										return transceiver.sender.track && transceiver.sender.track.kind === "audio";
									});
									if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
										if (audioTransceiver.direction === "sendrecv") {
											if (audioTransceiver.setDirection) {
												audioTransceiver.setDirection("sendonly");
											} else {
												audioTransceiver.direction = "sendonly";
											}
										} else if (audioTransceiver.direction === "recvonly") {
											if (audioTransceiver.setDirection) {
												audioTransceiver.setDirection("inactive");
											} else {
												audioTransceiver.direction = "inactive";
											}
										}
									} else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
										pc.addTransceiver("audio");
									}
									var videoTransceiver = pc.getTransceivers().find(function (transceiver) {
										return transceiver.sender.track && transceiver.sender.track.kind === "video";
									});
									if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
										if (videoTransceiver.direction === "sendrecv") {
											videoTransceiver.setDirection("sendonly");
										} else if (videoTransceiver.direction === "recvonly") {
											videoTransceiver.setDirection("inactive");
										}
									} else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
										pc.addTransceiver("video");
									}
								}
								return origCreateOffer.apply(pc, arguments);
							};
						}
					};
				}, { "../utils": 13 }], 13: [function (require, module, exports) {
					"use strict";
					function extractVersion(uastring, expr, pos) {
						var match = uastring.match(expr);
						return match && match.length >= pos && parseInt(match[pos], 10);
					}
					function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
						if (!window.RTCPeerConnection) {
							return;
						}
						var proto = window.RTCPeerConnection.prototype;
						var nativeAddEventListener = proto.addEventListener;
						proto.addEventListener = function (nativeEventName, cb) {
							if (nativeEventName !== eventNameToWrap) {
								return nativeAddEventListener.apply(this, arguments);
							}
							var wrappedCallback = function (e) {
								cb(wrapper(e));
							};
							this._eventMap = this._eventMap || {};
							this._eventMap[cb] = wrappedCallback;
							return nativeAddEventListener.apply(this, [nativeEventName, wrappedCallback]);
						};
						var nativeRemoveEventListener = proto.removeEventListener;
						proto.removeEventListener = function (nativeEventName, cb) {
							if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[cb]) {
								return nativeRemoveEventListener.apply(this, arguments);
							}
							var unwrappedCb = this._eventMap[cb];
							delete this._eventMap[cb];
							return nativeRemoveEventListener.apply(this, [nativeEventName, unwrappedCb]);
						};
						Object.defineProperty(proto, "on" + eventNameToWrap, {
							get: function () {
								return this["_on" + eventNameToWrap];
							}, set: function (cb) {
								if (this["_on" + eventNameToWrap]) {
									this.removeEventListener(eventNameToWrap, this["_on" + eventNameToWrap]);
									delete this["_on" + eventNameToWrap];
								}
								if (cb) {
									this.addEventListener(eventNameToWrap, this["_on" + eventNameToWrap] = cb);
								}
							}
						});
					}
					var logDisabled_ = true;
					var deprecationWarnings_ = true;
					module.exports = {
						extractVersion: extractVersion, wrapPeerConnectionEvent: wrapPeerConnectionEvent, disableLog: function (bool) {
							if (typeof bool !== "boolean") {
								return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
							}
							logDisabled_ = bool;
							if (bool) {
								return "adapter.js logging disabled";
							} else {
								return "adapter.js logging enabled";
							}
						}, disableWarnings: function (bool) {
							if (typeof bool !== "boolean") {
								return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
							}
							deprecationWarnings_ = !bool;
							return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
						}, log: function () {
							if (typeof window === "object") {
								if (logDisabled_) {
									return;
								}
								if (typeof console !== "undefined" && typeof console.log === "function") {
									console.log.apply(console, arguments);
								}
							}
						}, deprecated: function (oldMethod, newMethod) {
							if (!deprecationWarnings_) {
								return;
							}
							console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
						}, detectBrowser: function (window) {
							var navigator = window && window.navigator;
							var result = {};
							result.browser = null;
							result.version = null;
							if (typeof window === "undefined" || !window.navigator) {
								result.browser = "Not a browser.";
								return result;
							}
							if (navigator.mozGetUserMedia) {
								result.browser = "firefox";
								result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);
							} else if (navigator.webkitGetUserMedia) {
								result.browser = "chrome";
								result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
							} else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
								result.browser = "edge";
								result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);
							} else if (navigator.mediaDevices && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
								result.browser = "safari";
								result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
							} else {
								result.browser = "Not a supported browser.";
								return result;
							}
							return result;
						}
					};
				}, {}]
			};
			var n = {};
			var r = [3];
			var i = typeof require == "function" && require;
			for (var o = 0; o < r.length; o++) {
				s(r[o]);
			}
			return s;
		}()(3);
	};
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f();
	} else if (typeof define === "function" && define.amd) {
		define([], f);
	} else {
		var g;
		if (typeof window === "undefined") {
			if (typeof global === "undefined") {
				if (typeof self === "undefined") {
					g = this;
				} else {
					g = self;
				}
			} else {
				g = global;
			}
		} else {
			g = window;
		}
		g.adapter = f();
	}
}());
