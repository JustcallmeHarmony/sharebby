import {useState} from 'react';
import {
  Text,
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableHighlight,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
const leftArrow = require('../../assets/icons/back.png');
const EditProfile = ({navigation, route}) => {
  const [nickname, setNickname] = useState(route.params.nickname);
  const usersCollection = firestore().collection('users');

  const getPhotos = async () => {
    console.log('image edit');
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      multiple: false,
    }).then(images => {
      console.log(images);
      UploadImage(images.sourceURL);
    });
  };
  const UploadImage = async uri => {
    //tHb81DaAtCb5c3V3sJ9PodWT5ye2
    const reference = storage().ref(
      `gs://sharebby-4d82f.appspot.com/${route.params.uuid}.png`,
    );
    await reference.putFile(
      Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    );
    try {
      const userDocRef = await usersCollection.doc(route.params.uuid);

      await userDocRef.update({
        profileImage: `https://firebasestorage.googleapis.com/v0/b/sharebby-4d82f.appspot.com/o/gs%3A%2Fsharebby-4d82f.appspot.com%2F${route.params.uuid}.png?alt=media&token=92ecd5cd-c85c-4d52-ada9-948f13d362d7`,
      });
    } catch (error) {
      console.log(error.message);
    }
    await navigation.reset({
      index: 0,
      routes: [{name: 'BottomTab', params: {screen: 'Profile'}}],
    });
  };
  const UpdateNickname = async () => {
    try {
      const userDocRef = await usersCollection.doc(route.params.uuid);

      await userDocRef.update({nickname: nickname});
      await navigation.reset({
        index: 0,
        routes: [{name: 'BottomTab', params: {screen: 'Profile'}}],
      });
    } catch (error) {
      console.log('에러');
      console.log(error.message);
    }
  };
  return (
    <ScrollView style={{flex: 1}}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={{width: 50, height: 50}} source={leftArrow} />
        </TouchableOpacity>
        <Text style={{fontSize: 20, fontWeight: 'bold', marginTop: 13}}>
          프로필 수정
        </Text>
      </View>

      <TouchableOpacity
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => getPhotos()}>
        <Image
          style={{
            width: 120,
            height: 120,
            borderRadius: 50,
          }}
          source={{uri: route.params.profileImage}}
        />
      </TouchableOpacity>
      <View style={{margin: 25}}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 10,
          }}>
          내 정보
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 10,
            color: '#3f3f3f',
          }}>
          이름
        </Text>
        <TextInput
          onChangeText={setNickname}
          style={{
            height: 40,
            marginTop: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderRadius: 10,
            borderColor: '#07AC7D',
            padding: 10,
          }}
          value={nickname}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 10,
            color: '#3f3f3f',
          }}>
          주소
        </Text>
        <TouchableHighlight
          style={{
            height: 40,
            marginTop: 12,
            marginBottom: 12,
            borderWidth: 1,
            backgroundColor: '#DBDBDB',
            borderRadius: 10,
            borderColor: '#07AC7D',
            padding: 10,
          }}>
          <Text>{route.params.address}</Text>
        </TouchableHighlight>

        <TouchableOpacity
          onPress={() => {
            UpdateNickname();
          }}
          style={{
            backgroundColor: '#07AC7D',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            marginTop: 12,
            marginBottom: 12,
            borderRadius: 10,
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#fff',
            }}>
            완료
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    flexDirection: 'row',
  },
});
export default EditProfile;
