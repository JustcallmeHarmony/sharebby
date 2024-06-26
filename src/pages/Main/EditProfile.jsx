import {useState} from 'react';
import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginModal from '../../components/SignUp/LoginModal';
import auth from '@react-native-firebase/auth';

import {BackIcon} from '../../assets/assets';
const EditProfile = ({navigation, route}) => {
  const [nickname, setNickname] = useState(route.params.nickname);
  const [editImage, setEditImage] = useState({
    IsEdit: false,
    ImageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setDeleteShowModal] = useState(null);
  const usersCollection = firestore().collection('users');

  const getPhotos = async () => {
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      multiple: false,
    }).then(image => {
      // console.log('사진 업로드', images.sourceURL);
      // const imageUrl = image.path
      setEditImage({
        IsEdit: true,
        ImageUrl: image.path,
      });
    });
  };
  const UploadImage = async uri => {
    try {
      setLoading(true);
      const reference = storage().ref(
        `gs://sharebbyteam.appspot.com/${route.params.uuid}.png`,
      );
      await reference.putFile(
        Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      );
      const userDocRef = await usersCollection.doc(route.params.uuid);

      await userDocRef.update({
        profileImage: `https://firebasestorage.googleapis.com/v0/b/sharebbyteam.appspot.com/o/gs%3A%2Fsharebbyteam.appspot.com%2F${route.params.uuid}.png?alt=media&token=6e683a2e-273d-4bda-aedc-f135833642c8`,
      });
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false); // 작업이 끝나면 로딩 상태 해제
    }
  };
  const UpdateNickname = async () => {
    try {
      setLoading(true);
      const userDocRef = await usersCollection.doc(route.params.uuid);

      await userDocRef.update({nickname: nickname});
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false); // 작업이 끝나면 로딩 상태 해제
    }
  };

  const goHome = async () => {
    await navigation.reset({
      index: 0,
      routes: [{name: 'BottomTab', params: {screen: 'Profile'}}],
    });
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const user = auth().currentUser;

      if (user) {
        // 사용자 정보 삭제
        await usersCollection.doc(user.uid).delete();

        // 사용자 인증 정보 삭제
        await user.delete();

        // 사용자가 속한 채팅방 찾아서 삭제
        const chatRoomsSnapshot = await firestore()
          .collection('chatRooms')
          .where('members', 'array-contains', user.uid)
          .get();

        const deleteChatPromises = [];
        chatRoomsSnapshot.forEach(async doc => {
          const chatRoomRef = firestore().collection('chatRooms').doc(doc.id);
          const currentMembers = doc.data().members;
          const updatedMembers = currentMembers.filter(
            memberUID => memberUID !== user.uid,
          );
          deleteChatPromises.push(
            chatRoomRef.update({members: updatedMembers}),
          );
        });
        await Promise.all(deleteChatPromises);

        // AsyncStorage 초기화
        await AsyncStorage.clear();

        setDeleteShowModal(false);
        navigation.reset({
          index: 0,
          routes: [{name: 'Login'}],
        });
      }
    } catch (error) {
      console.log('회원탈퇴 오류:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModalClose = () => {
    setDeleteShowModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={1}
      style={styles.container}>
      {loading && ( // 로딩 상태면 인디케이터 표시
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#898989" />
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image style={styles.arrow} source={BackIcon} />
        </TouchableOpacity>
        <Text style={styles.headtext}>프로필 수정</Text>
      </View>

      <View style={styles.userContainer}>
        <TouchableOpacity
          style={styles.ImageWrapper}
          onPress={() => getPhotos()}>
          <Image
            style={styles.image}
            source={{uri: editImage.ImageUrl || route.params.profileImage}}
          />
        </TouchableOpacity>
        <View style={styles.editProfileWrapper}>
          <Text style={styles.itemText}>이름</Text>
          <TextInput
            onChangeText={setNickname}
            style={styles.nameBox}
            value={nickname}
          />

          <Text style={styles.itemText}>주소</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{route.params.address}</Text>
          </View>
          <View style={{marginTop: 16, marginLeft: 2}}>
            <TouchableOpacity onPress={() => setDeleteShowModal(true)}>
              <Text style={{color: '#898989', fontSize: 16}}>
                <Text style={{textDecorationLine: 'underline'}}>회원탈퇴</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={async () => {
          setLoading(true);
          await UpdateNickname();
          if (editImage.IsEdit) {
            await UploadImage(editImage.ImageUrl);
          }
          await goHome();
          setLoading(false);
        }}
        style={styles.submitBox}>
        <Text style={styles.sumbitText}>완료</Text>
      </TouchableOpacity>
      <LoginModal
        animationType="slide"
        visible={showDeleteModal}
        closeModal={handleDeleteModalClose}
        message="회원탈퇴"
        message2="정말 탈퇴하시겠어요?"
        LeftButton="취소"
        RightButton="탈퇴하기"
        onConfirm={handleDelete}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefffe',
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
  },
  arrow: {width: 22, height: 22},
  headtext: {fontSize: 20, fontWeight: 'bold', marginLeft: 10},

  userContainer: {
    flex: 1,
  },
  ImageWrapper: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 50,
  },
  editProfileWrapper: {
    marginLeft: 25,
    marginRight: 25,
    marginBottom: 25,
    marginTop: 10,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#3f3f3f',
  },
  nameBox: {
    height: 45,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#07AC7D',
    padding: 10,
    fontSize: 17,
  },

  addressBox: {
    height: 45,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#DBDBDB',
    borderRadius: 10,
    borderColor: '#07AC7D',
    padding: 10,
  },
  addressText: {
    fontSize: 17,
  },
  submitBox: {
    backgroundColor: '#07AC7D',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    marginBottom: 12,
    borderRadius: 10,
    marginHorizontal: 25,
    marginTop: 10,
  },
  sumbitText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default EditProfile;
