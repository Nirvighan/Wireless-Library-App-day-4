import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet ,Image} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import firebase from 'firebase';
import db from '../Config';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedData: '',
        buttonState: 'normal',
        scannedBookId:'',
        scannedStudentId:'',
        transactionMessage:''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
       
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state
      if(buttonState === "BookId")
      {
        this.setState({
          scanned:true,
          scannedBookId:data,
          buttonState:'normal'
        })
      }else if(buttonState === "StudentId")
      {
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }


      
    }

    initiateBookIssue = async() => {
     //add a transaction
     db.collection("Transaction").add({
       'StudentId':this.state.scannedStudentId,
       'BookId':this.state.scannedBookId,
       'date':firebase.firestore.Timestamp.now().toDate(),
       'TransactionType':"Issue",
     })
     
     //change book status

     db.collection("Books").doc(this.state.scannedBookId).update({
       'BookAvailability':false
     })

     //change no. of issued book for the student

     db.collection("Students").doc(this.state.scannedStudentId).update({
       'NumberOfBookIssued':firebase.firestore.FieldValue.increment(1)
     })

     this.setState({
       scannedBookId:'',
       scannedStudentId:''
     })

    }

    initiateBookReturn = async() => {
      //add a transaction
      db.collection("Transaction").add({
        'StudentId':this.state.scannedStudentId,
        'BookId':this.state.scannedBookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'TransactionType':"Return",
      })
      
      //change book status
 
      db.collection("Books").doc(this.state.scannedBookId).update({
        'BookAvailability':true
      })
 
      //change no. of issued book for the student
 
      db.collection("Students").doc(this.state.scannedStudentId).update({
        'NumberOfBookIssued':firebase.firestore.FieldValue.increment(-1)
      })
 
      this.setState({
        scannedBookId:'',
        scannedStudentId:''
      })
 
     }
 

    handleTransaction = async () =>
    {
       var transactionMessage = null;
       db.collection("Books").doc(this.state.scannedBookId).get().then((doc) => {
         var book = doc.data();
         console.log(book);

         if(book.BookAvailability)
         {
           this.initiateBookIssue();
           transactionMessage = "Book Issued";
         } else
         {
           this.initiateBookReturn();
           transactionMessage = "Book Returned";
         }
       })

       this.setState({
         transactionMessage:transactionMessage
       })
    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(

          <View style={styles.container}>
            <View>
              <Image
               source = {require("../booklogo.jpg")}
               style = {{width:200,height:200}}
              />
                <Text style = {{textAlign:'center',fontSize:30}}>
                  Willy
                </Text>
            </View>
           <View style = {styles.inputView}>
             <TextInput
             style = {styles.inputBox}
             placeholder = "BookId"
             value = {this.state.scannedBookId}
             />

             <TouchableOpacity
               style = {styles.scanButton}
               onPress = {() => {
                 this.getCameraPermissions("BookId");
               }}>
                <Text style = {styles.buttonText}>SCAN</Text>
            </TouchableOpacity>
             </View> 

             <View style = {styles.inputView}>
             <TextInput
             style = {styles.inputBox}
             placeholder = "StudentId"
             value = {this.state.scannedStudentId}
             />

             <TouchableOpacity
               style = {styles.scanButton}
               onPress = {() => {
                this.getCameraPermissions("StudentId");
              }}>
                <Text style = {styles.buttonText}>SCAN</Text>
            </TouchableOpacity>


           

             </View> 
             <TouchableOpacity
            style = {styles.submitButton}
            onPress = {async() => {
              this.handleTransaction();
            }}
           >
             <Text style = {styles.submitButtonText}>SUBMIT</Text>

           </TouchableOpacity>
          
        </View>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      width:100,
      borderWidth:1.5,
      borderLeftWidth:0,
     
      
    },
    buttonText:{
      fontSize: 20,
      textAlign:'center'
    },

    inputView:{
      flexDirection:'row',
      margin:20
    },

    inputBox:
    {
      width:200,
      height:40,
      borderWidth:1.5,
      borderRightWidth:0,
      fontSize:20
    },

    submitButton:
    {
      width:100,
      height:40,
      backgroundColor:'#FBC02D',
      
    },

    submitButtonText:
    {
      textAlign:'center',
      padding:10,
      fontSize:20,
      fontWeight:'bold',
      color:'white'
    }

  });