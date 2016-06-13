
//require('cloud/jobs');
// Use Parse.Cloud.define to define as many cloud functions as you want.
var client = require(__dirname + '/myMailModule-1.0.0.js');
client.initialize('sandboxd4c1fff0eef345918700b3f7763ea660.Mailgun.Org', 'key-eb5c861840c9606f6e8cdb6905e7d66b');
//Then inside of your Cloud Code function, you can use the sendEmail function to fire off some emails:


/* SEND EMAIL
//----------------------------------------------//
// ELENCO TIPOLOGIE EMAIL
//----------------------------------------------//
 10 - nuova richiesta - client
 20 - nuova richiesta - professional
 30 - nuova richiesta - admin
 40 - richiesta annullata - client
 50 - richiesta annullata - professional
 60 - richiesta annullata - admin
 70 - offerta accettata - client
 80 - offerta accettata - professional
 85 - offerta accettata - professional
 90 - offerta accettata - admin
 100 - nuova offerta - client
 110 - nuova offerta - professional
 120 - offerta superata - professional
 130 - nuova offerta - admin
//----------------------------------------------//
*/
var TYPE_NEW_REQUEST = "TYPE_NEW_REQUEST";
var TYPE_CANCELED_REQUEST = "TYPE_CANCELED_REQUEST";
var TYPE_NEW_OFFER = "TYPE_NEW_OFFER";
var TYPE_ACCEPTED_OFFER = "TYPE_ACCEPTED_OFFER";

var DEFAULT_LANG = 'it-IT';
var DEFAULT_ADMIN_EMAIL = 'admin@rukku.com';

var NAME_APP;
var ID_REQUEST;
var CREATEDAT_REQUEST;
var NAME_USER_CLIENT;
var BEST_PRICE;
var ID_OFFER;
var CREATEDAT_OFFER;
var NAME_USER_PROFESSIONAL;
var PRICE_OFFER;

var arrayFindString = new Array;
var arrayNwString = new Array;

//----------------------------------------------//
//START LIST FUNCTIONS 
//----------------------------------------------//

function getEmailTemplates(lang,type){
	var query = new Parse.Query("EmailConfig");
	query.equalTo("lang", lang);
	query.equalTo("type", type);
	return query.find();
}


function getRequestDetail(idListForms){
	"use strict";
	console.log("\n +++++++++ STEP 2\n "+idListForms + "\n");
	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserRequest');
	var myres = query.first();
	/*var myres = query.first({
	  success: function(results) {
	  	console.log("getRequestDetail.success");
    		console.log(results);
	    },
	    error: function(error) {
	    console.log("getRequestDetail.error");
	      console.log(error);
	    }
	    });
	    */
    
	console.log("getRequestDetail: " + myres);
	return myres;
}

function getOfferDetail(idListOffers){
	"use strict";
	console.log("\n +++++++++ STEP 3\n "+idListOffers + "\n");
	if(idListOffers){
		var query = new Parse.Query("ListOffers");
		query.equalTo("objectId", idListOffers);
		query.include('idUserResponder');
		var myres = query.first();
		console.log("getOfferDetail: " + myres);
		return myres;
	}
	return;
}

function getListAllEmailProfessional(){
	"use strict";
	console.log("\n +++++++++ STEP 4 getListAllEmailProfessional\n ");
	
	var query = new Parse.Query("Professional");
	query.include('idUser');
	/*
	var query = new Parse.Query("_User");		
	query.exists('idProfessional');
	query.include('idProfessional');
	*/
	var myres = query.find();
	console.log("getListAllEmailProfessional : "+ myres);
	return myres;
}

function getListEmailProfessionalSentOffer(idListForms){
	"use strict";
	console.log("\n +++++++++ STEP 4 getListEmailProfessionalSentOffer ++++++++++++\n"+idListForms);
	var Form = Parse.Object.extend("ListForms");
	var form = new Form();
	form.id = idListForms;
	var query = new Parse.Query("ListOffers");
	query.equalTo("idListForms", form);
	query.include('idUserResponder');
	return query.find();
}

function getLEmailLastBestOffer(idListForms){
	"use strict";
	console.log("\n +++++++++ STEP 4 getLEmailLastBestOffer ++++++++++++\n"+idListForms);
	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserResponder');
	return query.first();
}

function replaceString(string){
	"use strict";
	console.log("\n *********** replaceString START ************"+string);
	//[NAME_APP]
	//[ID_REQUEST]
	//[CREATEDAT_REQUEST]
	//[NAME_USER_CLIENT]
	//[BEST_PRICE]
	//[ID_OFFER]
	//[CREATEDAT_OFFER]
	//[NAME_USER_PROFESSIONAL]
	//[PRICE_OFFER]
	var newString = string;
  	for (var i = 0; i < arrayFindString.length; i++) {
		if(arrayNwString[i]){
			newString = newString.split(arrayFindString[i]).join(arrayNwString[i]); //Replace all instances of a substring
    		//newString = newString.replace(arrayFindString[i], arrayNwString[i]);
			//console.log("\n newString: "+newString+"  arrayFind:"+arrayFindString[i] + " arrayNwString: "+arrayNwString[i]);
		}
  	}
	//console.log("\n *********** replaceString END ************* newString: "+newString);
	return newString;
}

function checkNotification(idListForms, emailTo, result){
	console.log("\n\n");
	console.log("* checkNotification * ");
	console.log("idListForms: " + idListForms);
	console.log("emailTo: " + emailTo);

	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserResponder');
	query.include('idUserRequest');
	query.first().then(function(request){
		var idOfferAccepted = request.get("idOfferAccepted").id;
		var Offers = Parse.Object.extend("ListOffers");
		offer = new Offers();
		offer.id = idOfferAccepted;


		console.log("idOfferAccepted: " + idOfferAccepted);
		var userRequest = request.get("idUserRequest");
		var userRequestEmail = userRequest.get("email");
		console.log("userRequestEmail: " + userRequestEmail);
		var userResponder = request.get("idUserResponder");
		var userResponderEmail = userResponder.get("email");
		console.log("userResponderEmail: " + userResponderEmail);

		

		var payment = new Parse.Query("Payments");
		payment.equalTo("idOffer", offer);
		payment.first().then(function(pay){
			
			
			console.log(" ======== select notify");
			switch(emailTo) {
			    case userRequestEmail:

			        pay.set("userRequestNotified", result);
			        console.log(" ======== IS UserRequest: "+ result);
			        pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        break;
			    case userResponderEmail:

			    	pay.set("userResponderNotified", result);
			    	console.log(" ======== IS UserResponder: "+ result);
			    	pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        
			        break;
			    case DEFAULT_ADMIN_EMAIL:
			    	pay.set("adminNotified", result);
			    	console.log(" ======== IS Admin: " + result);
			    	pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        
			        break;
			    default:
        			console.log(" ======== Nessuno" + result);
			}

			
			
		})

	})
		
}

//----------------------------------------------//
//END LIST FUNCTIONS 
//----------------------------------------------//


//----------------------------------------------//
//START SEND EMAIL 
//----------------------------------------------//




function configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail){
	"use strict";
	//console.log("CONFIG-SEND-EMAIL: "+toEmail);
	/*
	console.log("***********configSendEmail*************");
	console.log("idListForms: " + idListForms);
	console.log("fromEmail: " + fromEmail);
	console.log("toEmail: " + toEmail);
	console.log("subjectEmail: " + subjectEmail);
	console.log("type: " + type);
	console.log("typeCode: " + typeCode);
	console.log("bodyEmail: " + bodyEmail);
	*/
	var arrayReplaceString = [];
	//console.log("Subject: "+replaceString(subjectEmail));
	//console.log("Body: "+replaceString(bodyEmail));
	arrayReplaceString.push(replaceString(subjectEmail));	
	arrayReplaceString.push(replaceString(bodyEmail));	
	Parse.Promise.when(arrayReplaceString).then(
	function(results) {
		config.log("results");
		config.log(results);
		
		var nwSubjectEmail = results[0];
		console.log("nwSubjectEmail :");
		console.log(nwSubjectEmail);
		
		var nwBodyEmail = results[1];
		console.log("nwBodyEmail : ");
		console.log(nwBodyEmail);
		console.log("Parse.Promise.when -> "+toEmail);
		Parse.Cloud.run('sendEmail', {
				"idListForms" : idListForms, 
				"fromEmail" : fromEmail,
				"toEmail" : toEmail,
				"subjectEmail" : nwSubjectEmail,
				"type" : type,
				"typeCode" : typeCode,
				"bodyEmail" : nwBodyEmail
			}).then(function(resp) {
				console.log(resp);
				return(resp);
			}, function(error) {
				console.log(error);
				return(error);
			});
	},function(error) {
	  // error
	  console.log(error);
	  return(error);
	});	
}


Parse.Cloud.define("sendEmail", function(request, response) {
	"use strict";
	
	//console.log("+++++++++ sendEmail ++++++++++++");

	var fromEmail = request.params.fromEmail;
	var toEmail = request.params.toEmail;
  	var bodyEmail = request.params.bodyEmail;
  	var subjectEmail = request.params.subjectEmail;
  	var idListForms = request.params.idListForms;
  	var typeSendEmail = request.params.type;
  	var htmlBody = bodyEmail;
  	
	/*
	console.log("\n +++++++++ fromEmail ++++++++++++"+fromEmail);
	console.log("\n +++++++++ toEmail ++++++++++++"+toEmail);
	console.log("\n +++++++++ bodyEmail ++++++++++++"+bodyEmail);
	console.log("\n +++++++++ subjectEmail ++++++++++++"+subjectEmail);
	console.log("\n +++++++++ idListForms ++++++++++++"+idListForms);
	console.log("\n +++++++++ typeSendEmail ++++++++++++"+typeSendEmail);	
	*/
	client.sendEmail({
		to: toEmail,
		//bcc: arrayToEmail,
		from: fromEmail,
		subject: subjectEmail,
		text: bodyEmail,
		html: htmlBody
	}).then(function(httpResponse) {
		console.log("SAND EMAIL-Success: "+toEmail);
		console.log("idListForms: " + idListForms);
		if(typeSendEmail == TYPE_ACCEPTED_OFFER){
			console.log("send email: " + typeSendEmail);
			console.log("idForms: " + request.params.idListForms);
			//da idListForms ricavo l'idOfferAccepted che mi servirà per identificare l'id del Paganmento in Payment
			checkNotification(request.params.idListForms, toEmail, true);


		}
		//response.success("Email sent! "+toEmail);
	}, function(httpResponse) {
		console.log("\n ERROR SAND EMAIL\n arrayToEmail:"+toEmail+"\n" );
		checkNotification(request.params.idListForms, toEmail, false);
		//console.error(httpResponse);
		//response.error("Uh oh, something went wrong");
	});
});
//----------------------------------------------//
//END SEND EMAIL 
//----------------------------------------------//


//----------------------------------------------//
//START PUSH NOTIFICATION 
//----------------------------------------------//
function configNotification(idListForms,idTo,subjectEmail,badge,type,idUserRequest){
	"use strict";
	console.log(" * configNotification * ");
	//console.log("\n +++++++++ configNotification ++++++++++++\n idListForms:"+idListForms+"\n idTo:"+idTo+"\n subjectEmail:"+subjectEmail+"\n badge:"+badge);
	var arrayReplaceString = [];
	arrayReplaceString.push(replaceString(subjectEmail));	
	Parse.Promise.when(arrayReplaceString).then(
	function(results) {
		var nwSubjectEmail = results[0];
		
		console.log("idListForms: " +idListForms);
		console.log("idTo: " +idTo);
		console.log("subjectEmail: " +nwSubjectEmail);
		console.log("badge: " +badge);
		
		Parse.Cloud.run('sendNotification', {
			"idListForms" : idListForms,
			"idTo" : idTo,
			"alertMessage" : nwSubjectEmail,
			"badge" : badge,
			"type" : type,
			"idUserRequest" : idUserRequest
		}).then(function(resp) {
			return(resp);
		});
	},function(error) {
	  console.log("+++++++++ sendNotification error ++++++++++++"+error);
	  return(error);
	});
}

Parse.Cloud.define("sendNotification", function(request, response) {
    "use strict";
	console.log("+++++++++ sendNotification ++++++++++++");
    var idTo = request.params.idTo;
    var alertMessage = request.params.alertMessage;
    var idListForms = request.params.idListForms;
    var badge = parseInt(request.params.badge);
    var type = request.params.type;
    var idUserRequest = request.params.idUserRequest;
    //Set push query
/*	var pushQuery = new Parse.Query(Parse.Installation);
	var targetUser = new Parse.User();
	targetUser.id = idTo;
	pushQuery.equalTo("user", targetUser);
	*/
/*
	Parse.Push.send(
	{
		where: pushQuery,
		data: {
			to: idTo,
			//t: "chat", // type
			idListForms: idListForms,
			badge: badge,
			alert: alertMessage,
			sound: "chime",
			title: alertMessage, // android only
			type: type,
			idUserRequest: idUserRequest
		}
	},
	{
		success: function(){
			response.success('notification sent');
		},
		error: function (error) {
			response.error(error);
		}
	});*/
});


//----------------------------------------------//
// SAVE PAYMENT

//-----------------------------------------------//

function sendNotificationOffer(request){
	console.log("\n\n");
	console.log("* sendNotificationOffer *");
	console.log("idPayment: " + request.params.idPayment);
	var idOffer = request.params.idOffer; 
	console.log("idOffer: " + idOffer);
	var query = new Parse.Query("ListOffers");
	query.equalTo("objectId", idOffer);
	query.first({
		success: function(offer){
			console.log("idForms: " + offer.get("idListForms").id);
			var idListForms = offer.get("idListForms").id;
			console.log("TYPE_ACCEPTED_OFFER: " + TYPE_ACCEPTED_OFFER);
			Parse.Cloud.run('sendMessages', {
				"lang" : request.params.lang,
				"typeSendEmail" : TYPE_ACCEPTED_OFFER,
				"emailAdmin" : request.params.emailAdmin,
				"appName": request.params.appName,
				"idListForms" : idListForms,
				"idListOffers" : idOffer,
				//"idPayment": request.params.idPayment
			}).then(function(resp) {
				return(resp);
			});

		},
		error: function(error){
			console.log("Error prapare offer notofocation: " + error);

		}
	});
}


Parse.Cloud.define("savePayment", function(request, response) {
    console.log("\n\n");
	console.log("* savePayment *");
	var idPayment = request.params.idPayment;
	var datePayment = request.params.datePayment;
	var idOffer = request.params.idOffer;
	var amount = request.params.amount;
	var lang = request.params.lang;
	var emailAdmin = request.params.emailAdmin;
	var appName = request.params.appName;

	console.log("idPayment: " + idPayment);
	console.log("datePayment: " + datePayment);
	console.log("idOffer: " + idOffer);
	console.log("amount: " + amount);
	console.log("lang: " + lang);
	console.log("emailAdmin: " + emailAdmin);
	console.log("appName: " + appName);


	var Offers = Parse.Object.extend("ListOffers");
	offer = new Offers();
	offer.id = idOffer;
	console.log("1 ------------------------------------------------------------------------------------------------");


	var Payments = Parse.Object.extend("Payments");
	payment = new Payments();

	
	payment.set("idPayment" , idPayment);
	payment.set("idOffer" , offer);
	payment.set("amount" , Number(amount));

	console.log("2 ------------------------------------------------------------------------------------------------");

	var dateP = new Date(datePayment);
	payment.set("datePayment" , dateP);

	payment.save(null, {
		success: function(payment) {
			console.log("SUCCESS save Payment"),
			console.log("request Admin: " + request.params.emailAdmin);
			console.log("idPayment: " + payment.id);
			//request.params.idPayment = payment.id;
			sendNotificationOffer(request);

			//response.success("Payment saved");

		},
		error: function(error) {
			console.log("error save Payment: " + error);
			response.error('error save Payment:' + JSON.stringify(error));
		}
	});




});



//----------------------------------------------//
//START Send Messages 
//----------------------------------------------//


function sendAllMessage(request){
	console.log("\n\n");
	console.log("================================================");
	console.log("---------SEND MESSAGE: "+request.params.idListForms+"--------------");
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	var emailAdmin = request.params.emailAdmin;
	var appName = request.params.appName;
	var idListForms = request.params.idListForms;
	var idListOffers = request.params.idListOffers;
	var arrayEmailTemplate = new Array;

	console.log("lang: " + lang);
	console.log("type: " +type);
	console.log("emailAdmin: " +emailAdmin);
	console.log("appName: " + appName);
	console.log("idListForms: " +idListForms);
	console.log("idListOffers: " +idListOffers);




	/*
	//IdUserRequests
	var ObjectRequest = Parse.Object.extend("ListForms");
	var query = new Parse.Query(ObjectRequest);
	query.equalTo("objectId",idListForms);
	query.first().get("idUserRequest").id;
	*/

	//var ObjectOffer = Parse.Object.extend("ListOffers");
	

	var UserSender = Parse.Object.extend("_User");
	var userSenderClient = new UserSender();
	var userSenderProfessional = new UserSender();
	var arrayAllEmailTo = new Array;
	var functionGetAddressesEmail;
	
   // Parse.Cloud.useMasterKey();
	var listFunctionsToCall = [];
	//results1
	var functionGetEmailTemplates = getEmailTemplates(lang,type);
	listFunctionsToCall.push(functionGetEmailTemplates);	
	//results2
	console.log("before functionGetRequestDetail");
	var functionGetRequestDetail = getRequestDetail(idListForms);
	console.log("after functionGetRequestDetail");
	
	Parse.Promise.when(functionGetRequestDetail).then(function(result) {
		console.log("result of functionGetRequestDetail : ");
		console.log(result);
	});
	
	listFunctionsToCall.push(functionGetRequestDetail);
	//results3
	var functionGetOfferDetail = getOfferDetail(idListOffers);
	listFunctionsToCall.push( functionGetOfferDetail);
	//results4
	if(type === TYPE_NEW_REQUEST ){
		console.log("TYPE_NEW_REQUEST");
		functionGetAddressesEmail = getListAllEmailProfessional();
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_CANCELED_REQUEST ){
		functionGetAddressesEmail = getListEmailProfessionalSentOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_NEW_OFFER ){
		functionGetAddressesEmail = getLEmailLastBestOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_ACCEPTED_OFFER ){
		functionGetAddressesEmail = getListEmailProfessionalSentOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
    Parse.Promise.when(listFunctionsToCall).then(
		function(results){
			"use strict";
			console.log("listFunctionsToCall");
			console.log("results: " );
			console.log(results );
			
			var results1 = results[0];
			console.log("results1: ");
			console.log(results1);


			var objectRequest = results[1];
			console.log("objectRequest: ");
			console.log(objectRequest);
			
			var objectOffer = results[2];
			console.log("objectOffer: ");
			console.log(objectOffer );  
			
			var results4 = results[3];
			console.log("results4: ");
			console.log(results4 );  
			//------------------------------------------------------//
			// START SET VARIABLES
			//------------------------------------------------------//
			// result1: 	  list email template 
			// objectRequest: request+UserRequest
			// objectOffer:   offer+UserResponder
			// result4: 	  (TYPE_NEW_REQUEST)  		list Professional + IdUser  
			//				  (TYPE_CANCELED_REQUEST) 	list Offers + IdUserResponder
			//				  (TYPE_NEW_OFFER) 			Request + idUserResponder (bestPrice)
			//				  (TYPE_ACCEPTED_OFFER)  = 	(TYPE_CANCELED_REQUEST)
			var i;
			for (i = 0; i < results1.length; i++) {
				arrayEmailTemplate.push(results1[i]);
			}
		
				
			for (i = 0; i < results4.length; i++) {
				arrayAllEmailTo.push(results4[i]);
			}	
			//console.log("\n objectRequest: "+objectRequest);  
			userSenderClient = objectRequest.get("idUserRequest");
			//var idUserRequest = userSenderClient.id;
			NAME_APP = appName;
			if(NAME_APP){
				arrayFindString.push("[NAME_APP]");
				arrayNwString.push(NAME_APP);
			}
			ID_REQUEST = idListForms;
			if(ID_REQUEST){
				arrayFindString.push("[ID_REQUEST]");
				arrayNwString.push(ID_REQUEST);
			}
			CREATEDAT_REQUEST = objectRequest.createdAt;
			if(CREATEDAT_REQUEST){
				arrayFindString.push("[CREATEDAT_REQUEST]");
				arrayNwString.push(CREATEDAT_REQUEST);
			}
			NAME_USER_CLIENT = userSenderClient.get("fullName");
			if(NAME_USER_CLIENT){
				arrayFindString.push("[NAME_USER_CLIENT]");
				arrayNwString.push(NAME_USER_CLIENT);
			}
			BEST_PRICE = objectRequest.get("price");
			if(BEST_PRICE){
				arrayFindString.push("[BEST_PRICE]");
				arrayNwString.push(BEST_PRICE);
			}
			ID_OFFER = idListOffers;
			if(ID_OFFER){
				arrayFindString.push("[ID_OFFER]");
				arrayNwString.push(ID_OFFER);
			}
			if(objectOffer){
				userSenderProfessional = objectOffer.get("idUserResponder");
				CREATEDAT_OFFER = objectOffer.createdAt;
				if(CREATEDAT_OFFER){
					arrayFindString.push("[CREATEDAT_OFFER]");
					arrayNwString.push(CREATEDAT_OFFER);
				}
				NAME_USER_PROFESSIONAL = userSenderProfessional.get("fullName");
				if(NAME_USER_PROFESSIONAL){
					arrayFindString.push("[NAME_USER_PROFESSIONAL]");
					arrayNwString.push(NAME_USER_PROFESSIONAL);
				}
				PRICE_OFFER = objectOffer.get("price");
				if(PRICE_OFFER){
					arrayFindString.push("[PRICE_OFFER]");
					arrayNwString.push(PRICE_OFFER);
				}
			}
			console.log("arrayEmailTemplate");  
			//console.log("\n job1: "+arrayEmailTemplate);  
			//console.log("\n job2: "+userSenderClient); 
			//------------------------------------------------------//
			// END SET VARIABLES
			//------------------------------------------------------//
			var promises = [];
			for (i = 0; i < arrayEmailTemplate.length; i++) 
			{
				var fromEmail = arrayEmailTemplate[i].get("fromEmail");
				if(!emailAdmin){
					emailAdmin = arrayEmailTemplate[i].get("toEmail");
				}
				var subjectEmail = arrayEmailTemplate[i].get("subjectEmail");
				var type = arrayEmailTemplate[i].get("type");
				var typeCode = arrayEmailTemplate[i].get("typeCode");
				var bodyEmail = arrayEmailTemplate[i].get("bodyEmail");
				
				var functionSendEmailtoAdmin;
				var functionSendEmailtoClient;
				var functionSendEmailtoProf;
				var functionSendNotification;

				var user = new UserSender();
				var ii;
				var toEmail;
				var idTo;
				var badge = 1;
				
				if(type === TYPE_NEW_REQUEST ){
					console.log("configNotification");
					if(typeCode === 10){
						// - invio email di conferma nuova richiesta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						//console.log("\nTYPE_NEW_REQUEST(10) - EmailTo: " + toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di nuova richiesta a tutti i professionisti e all'amministratore
						//console.log("\n ------arrayAllEmailProfessional : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							console.log(arrayAllEmailTo[ii].get("idUser").get("email")+" ------ " + arrayAllEmailTo[ii].get("idUser")._sessionToken);
						}
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUser");
							
							//console.log("SendTo: "+user.get("email"));
							//console.log("\n ------ user : "+arrayAllEmailTo[ii]+ " ---- user :"+arrayAllEmailTo[ii].get("idUser"));
							if(arrayToEmail.indexOf(user.get("email")) === -1){
								arrayToEmail.push(user.get("email"));
								toEmail = user.get("email");
								idTo = user.id;
								//console.log("\n ------prepare for send email : "+toEmail); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								//send notification
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);	
						}
					}
				} // end type === TYPE_NEW_REQUEST
				else if(type === TYPE_CANCELED_REQUEST){
					if(typeCode === 10){
						// - invio email di conferma eliminazione al cliente e all'amministratore
						//console.log("\n ------TYPE_CANCELED_REQUEST : "+userSenderClient.get("email"));
						toEmail = userSenderClient.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di conferma eliminazione a tutti i professionisti partecipanti all'asta e all'amministratore
						//console.log("\n ------arrayEmailProfessionalSentOffer : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUserResponder");
							if(arrayToEmail.indexOf(user.get("email")) === -1){
								arrayToEmail.push(user.get("email"));
								idTo = user.id;
								toEmail = user.get("email");
								//console.log("\n ------prepare for send idTo : "+idTo); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								//send notification
								console.log("userSenderClient.id: "+userSenderClient.id);
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);
						}
					}
				} // end if(type === TYPE_CANCELED_REQUEST)
				else if(type === TYPE_NEW_OFFER){
					if(typeCode === 10){
						// - invio email di una nuova offerta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						idTo = userSenderClient.id;
						//console.log("\n ------ 10 : "+toEmail);
						//fromEmail = userSenderProfessional.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
						
						//send notification
						functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
						promises.push(functionSendNotification);
					}
					else if(typeCode === 20){
						// - invio email di conferma nuova offerta al professionista e all'amministratore
						toEmail = userSenderProfessional.get("email");
						//console.log("\n ------ 20 : "+toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);		
					}
					else if(typeCode === 30){
						// - invio email di avviso superamento offerta al professionista e all'amministratore
						//console.log("\n ------ 30 : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUserResponder");
							if(arrayToEmail.indexOf(user.get("email")) === -1 && user.get("email") !== userSenderProfessional.get("email")){
								arrayToEmail.push(user.get("email"));
								idTo = user.id;
								toEmail = user.get("email");
								//console.log("\n ------prepare for send email : "+toEmail); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								
								//send notification
								console.log("userSenderClient.id: "+userSenderClient.id);
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);	
						}
					}
				} // end if(type === TYPE_NEW_OFFER)
				else if(type === TYPE_ACCEPTED_OFFER){
					if(typeCode === 10){
						// - invio email di una nuova offerta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						//console.log("\n ------ 10 : "+toEmail);
						//fromEmail = userSenderProfessional.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di conferma offerta accettata al professionista e all'amministratore
						toEmail = userSenderProfessional.get("email");
						idTo = userSenderProfessional.id;
						
						//console.log("\n ------ 20 : "+toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);
						
						//send notification
						functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
						promises.push(functionSendNotification);
					}
					else if(typeCode === 30){
						// - invio email di avviso chiusura richiesta ai professionista partecipanti all'asta e all'amministratore
						//console.log("\n ------ 30 : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUserResponder");
							if(arrayToEmail.indexOf(user.get("email")) === -1 && user.get("email") !== userSenderProfessional.get("email")){
								arrayToEmail.push(user.get("email"));
								idTo = user.id;
								toEmail = user.get("email");
								//console.log("\n ------prepare for send email : "+toEmail); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								
								//send notification
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);	
						}
					}
				} //end if(type === TYPE_ACCEPTED_OFFER)
				//console.log("\n ii: "+i);
			} // end cicle
		
			

			// Invio notifiche in serie 
			var promise = Parse.Promise.as();
            promises.forEach(function(p){
                promise = promise.then(p);
                 
            });
            
            return promise;
 
            //response.success("OK MESSAGE SAND");
			


			/* invio notifiche in serie (invia solo le prime 5)
			var promise = Parse.Promise.as();
			Parse.Promise.as().then(function(){ 

				promises.forEach(function(p){
					promise = promise.then(p);
					
				});
				return promise;
			}).then(function(result){
				response.success("OK MESSAGE SAND");
			},function(error) {
				console.log("Error Send Message: "+error);
	  			return(error);
			});
			*/
			
			/* invio notifiche in parallelo (invia solo le prime 5)
			Parse.Promise.when(promises).then(function() {
			  // all done
			  console.log("OK MESSAGE SAND");
			  response.success("OK MESSAGE SAND");
			}, function(error) {
			  // error
			  console.log("\n ***********ERROR*************");
			  response.error(error);
			});	
			*/
			
	}, 
	function(error) {
		console.log("error on promise: "+ error );
		response.error(error);
	}
	);
	
}		




Parse.Cloud.define("sendMessages", function(request, response) {
	//"use strict";
	
	console.log("* prepareMessageParameter *");
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	//control default template
	var query = new Parse.Query("EmailConfig");
	query.equalTo("lang", lang);
	query.equalTo("type", type);
	var prepare = query.count().then(function(num){
		//console.log("num: " + num);
		if(num==0){
			console.log("DEFAULT_LANG: " + DEFAULT_LANG);
			request.params.lang = DEFAULT_LANG;
		}
		return request;
		
	});

	//var prepareParameter = prepareMessageParameter(request);

	Parse.Promise.when(prepare).then(function(request) {
			  // all done
		sendAllMessage(request);
	  	console.log("OK MESSAGE SAND");
	  	//response.success("OK MESSAGE SAND");
	}, 	function(error) {
	  	// error
	  	console.log("***********ERROR SEND MESSAGE *************");
	  	console.log(error);
	  	response.error(error);
	});	

	/*
		//console.log("OK MESSAGE SAND");
	var callback = function(request){
		var sendMessageCallback = function(result){
			if(result){
				response.success("OK MESSAGE SAND");
			}else{
				response.success("ERROR to SAND MESSAGE");
			}
		}
		sendMessages(request, sendMessageCallback);
	}
	prepareMessageParameter(request, callback);
  	*/	
	
			 
  	//console.log("OK MESSAGE SAND");
  	//response.success("OK MESSAGE SAND");

});


Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


Parse.Cloud.define('testquery', function(req, res) {
 	var query = new Parse.Query("EmailConfig");
 	query.limit(1); 
	query.find({
    success: function(results) {
    	res.success("Payment saved");
    },
    error: function() {
      res.error("movie lookup failed");
    }
  });
});



Parse.Cloud.define('testquery2', function(req, res) {
 	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", "WNSbHDmE7u");
	query.include('idUserRequest');
	
	query.find({
    success: function(results) {
    	res.success(results);
    },
    error: function() {
      res.error("movie lookup failed2");
    }
  });
});




Parse.Cloud.define('testquery3', function(req, res) {
 	console.log("testquery3");
	var myfunc = [];
	myfunc.push(function(){console.log("test1")});
	myfunc.push(console.log("test2"));
	Parse.Promise.when(myfunc).then(function() {
		console.log("test3");
	});
	
	console.log("testquery3 end");
  });


Parse.Cloud.define('testnotify', function(req, res) {
	console.log("testnotify");
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("username", "aleoaleo");

	// Find devices associated with these users
	var pushQuery = new Parse.Query(Parse.Installation);
	pushQuery.matchesQuery('user', userQuery);
	
	//var query = new Parse.Query(Parse.Installation);
	//query.equalTo("objectId","0YMM3lzkr5");
/*	pushQuery.find({ useMasterKey: true ,
    success: function(results) {
    	res.success(results);
    },
    error: function(error) {
      res.error(error);
    }
    });*/
   
    Parse.Push.send(
	{
		where: pushQuery,
		data: {
			to: "7a8fXtnNsh",
			//t: "chat", // type
			idListForms: "WNSbHDmE7u",
			//badge: badge,
			alert: "ciao",
			sound: "chime",
			title: "alertMessage", // android only
			type: "TYPE_NEW_REQUEST",
			idUserRequest: "7a8fXtnNsh"
		}
	},
	{
		success: function(){
			response.success('notification sent');
		},
		error: function (error) {
			response.error(error);
		},	useMasterKey: true
	}
	
	);

	console.log("testnotify end");
});
