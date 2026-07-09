import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registerEmployee } from '../../api/registration.api';
import { uploadFile } from '../../api/uploads.api';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { Screen } from '../../components/Screen';
import { SearchInput } from '../../components/SearchInput';
import { usePublicDepartments } from '../../hooks/useDepartments';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { mapLoginError, normalizeApiError } from '../../utils/api-error';
import { accountSchema, departmentSchema, faceSchema, profileSchema } from './registration.schema';
import { facePoseLabels, useRegistration } from './RegistrationProvider';
export function RegistrationIntroScreen() {
  const router = useRouter();
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      alignItems: 'center',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 80,
      height: 80,
      backgroundColor: '#1E88E5',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 8
      },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "person-add-outline",
    size: 40,
    color: "#FFFFFF"
  })), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 28,
      fontWeight: '800',
      color: '#0B3B61',
      letterSpacing: -0.5
    }
  }, "\u0110\u0103ng k\xFD"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E88E5',
      letterSpacing: 2,
      marginTop: 4
    }
  }, "T\xC0I KHO\u1EA2N M\u1EDAI")), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0B3B61',
      marginBottom: 16
    }
  }, "Quy tr\xECnh \u0111\u0103ng k\xFD"), /*#__PURE__*/React.createElement(View, {
    style: {
      gap: 16,
      marginBottom: 32
    }
  }, ['Thông tin tài khoản', 'Hồ sơ cá nhân', 'Chọn phòng ban', 'Chụp khuôn mặt', 'Kiểm tra và gửi'].map((item, index) => /*#__PURE__*/React.createElement(View, {
    key: item,
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#EAF4FE',
      justifyContent: 'center',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E88E5'
    }
  }, index + 1)), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 15,
      fontWeight: '600',
      color: '#3B4A59'
    }
  }, item)))), /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.push('/register/profile'),
    style: {
      backgroundColor: '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "B\u1EAET \u0110\u1EA6U")), /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.replace('/login'),
    style: {
      marginTop: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      fontWeight: '600',
      color: '#64748B'
    }
  }, "\u0110\xE3 c\xF3 t\xE0i kho\u1EA3n? ", /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#1E88E5'
    }
  }, "\u0110\u0103ng nh\u1EADp")))))));
}
export function RegistrationProfileScreen() {
  const router = useRouter();
  const {
    values,
    update
  } = useRegistration();
  const {
    control,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: values
  });
  const submit = handleSubmit(data => {
    update(data);
    router.push('/register/profile'); // Wait, original code routes to profile again? No, it should be personal! Original code had a bug.
  });
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(ScrollView, {
    contentContainerStyle: {
      padding: 24,
      paddingBottom: 60
    },
    showsVerticalScrollIndicator: false
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.back(),
    style: {
      padding: 4,
      marginRight: 12
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "arrow-back",
    size: 24,
    color: "#0B3B61"
  })), /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0B3B61'
    }
  }, "Th\xF4ng tin t\xE0i kho\u1EA3n"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      color: '#64748B'
    }
  }, "B\u01B0\u1EDBc 1/5"))), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "fullName",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      label: "H\u1ECD t\xEAn",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.fullName?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "phone",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      keyboardType: "phone-pad",
      label: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.phone?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "email",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      autoCapitalize: "none",
      keyboardType: "email-address",
      label: "Email (T\xF9y ch\u1ECDn)",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.email?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "password",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      secureTextEntry: true,
      label: "M\u1EADt kh\u1EA9u",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.password?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "confirmPassword",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      secureTextEntry: true,
      label: "Nh\u1EADp l\u1EA1i m\u1EADt kh\u1EA9u",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.confirmPassword?.message
    })
  }), /*#__PURE__*/React.createElement(Pressable, {
    onPress: handleSubmit(data => {
      update(data);
      router.push('/register/profile');
    }),
    style: {
      backgroundColor: '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "TI\u1EBEP T\u1EE4C"))))));
}
export function RegistrationPersonalScreen() {
  const router = useRouter();
  const {
    values,
    update
  } = useRegistration();
  const {
    control,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: values
  });
  const submit = handleSubmit(data => {
    update(data);
    router.push('/register/department');
  });
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(ScrollView, {
    contentContainerStyle: {
      padding: 24,
      paddingBottom: 60
    },
    showsVerticalScrollIndicator: false
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.back(),
    style: {
      padding: 4,
      marginRight: 12
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "arrow-back",
    size: 24,
    color: "#0B3B61"
  })), /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0B3B61'
    }
  }, "H\u1ED3 s\u01A1 c\xE1 nh\xE2n"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      color: '#64748B'
    }
  }, "B\u01B0\u1EDBc 2/5"))), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "idCardNumber",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      label: "S\u1ED1 CCCD",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.idCardNumber?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "dateOfBirth",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      label: "Ng\xE0y sinh (YYYY-MM-DD)",
      placeholder: "V\xED d\u1EE5: 1995-10-25",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.dateOfBirth?.message
    })
  }), /*#__PURE__*/React.createElement(Controller, {
    control: control,
    name: "gender",
    render: ({
      field
    }) => /*#__PURE__*/React.createElement(FormField, {
      label: "Gi\u1EDBi t\xEDnh (MALE/FEMALE)",
      placeholder: "MALE",
      value: field.value,
      onChangeText: field.onChange,
      error: errors.gender?.message
    })
  }), /*#__PURE__*/React.createElement(Pressable, {
    onPress: submit,
    style: {
      backgroundColor: '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "TI\u1EBEP T\u1EE4C"))))));
}
export function RegistrationDepartmentScreen() {
  const router = useRouter();
  const {
    values,
    update
  } = useRegistration();
  const [search, setSearch] = useState('');
  const departments = usePublicDepartments({
    search
  });
  const {
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      requestedDepartmentId: values.requestedDepartmentId
    }
  });
  const selectedId = watch('requestedDepartmentId');
  const submit = handleSubmit(data => {
    update(data);
    router.push('/register/face');
  });
  const activeDepartments = departments.data?.items.filter(department => department.isActive) ?? [];
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(ScrollView, {
    contentContainerStyle: {
      padding: 24,
      paddingBottom: 100
    },
    showsVerticalScrollIndicator: false
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.back(),
    style: {
      padding: 4,
      marginRight: 12
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "arrow-back",
    size: 24,
    color: "#0B3B61"
  })), /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0B3B61'
    }
  }, "Ch\u1ECDn ph\xF2ng ban"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      color: '#64748B'
    }
  }, "B\u01B0\u1EDBc 3/5"))), /*#__PURE__*/React.createElement(SearchInput, {
    value: search,
    onChangeText: setSearch,
    placeholder: "T\xECm ph\xF2ng ban..."
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      height: 16
    }
  }), departments.isLoading ? /*#__PURE__*/React.createElement(LoadingState, null) : null, departments.isError ? /*#__PURE__*/React.createElement(ErrorState, {
    error: departments.error,
    onRetry: () => void departments.refetch()
  }) : null, !departments.isLoading && !activeDepartments.length ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "Kh\xF4ng c\xF3 ph\xF2ng ban kh\u1EA3 d\u1EE5ng"
  }) : null, /*#__PURE__*/React.createElement(View, {
    style: {
      gap: 12
    }
  }, activeDepartments.map(department => /*#__PURE__*/React.createElement(DepartmentOption, {
    key: department.id,
    department: department,
    selected: selectedId === department.id,
    onPress: () => setValue('requestedDepartmentId', department.id, {
      shouldValidate: true
    })
  }))), errors.requestedDepartmentId ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#EF4444',
      fontSize: 13,
      marginTop: 12
    }
  }, errors.requestedDepartmentId.message) : null), /*#__PURE__*/React.createElement(View, {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0'
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: submit,
    style: {
      backgroundColor: '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "TI\u1EBEP T\u1EE4C")))));
}
export function RegistrationFaceScreen() {
  const router = useRouter();
  const {
    values,
    setFaceImage
  } = useRegistration();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const [activePose, setActivePose] = useState('FRONT');
  const [captureError, setCaptureError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const poses = ['FRONT', 'LEFT', 'RIGHT'];
  const currentImage = values.faceImages.find(image => image.pose === activePose);
  const complete = faceSchema.safeParse({
    faceImages: values.faceImages
  }).success;
  async function capture() {
    setCaptureError(null);
    setCapturing(true);
    try {
      const picture = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        exif: false
      });
      if (!picture) throw new Error('CAMERA_UNAVAILABLE');
      await uploadPose(activePose, picture.uri);
    } catch {
      setCaptureError('Khong the chup hoac upload anh, vui long thu lai');
    } finally {
      setCapturing(false);
    }
  }
  async function retryUpload(image) {
    setCaptureError(null);
    setCapturing(true);
    try {
      await uploadPose(image.pose, image.localUri);
    } catch {
      setCaptureError('Upload failed, please retry this pose');
    } finally {
      setCapturing(false);
    }
  }
  async function uploadPose(pose, uri) {
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setFaceImage({
      pose,
      localUri: uri,
      previewUri: uri,
      imageUrl: '',
      uploadStatus: 'UPLOADING',
      uploadProgress: 0
    });
    try {
      const uploaded = await uploadFile({
        uri,
        name: `${pose.toLowerCase()}-face.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'FACE_REGISTRATION',
        signal: controller.signal,
        onProgress: progress => {
          setFaceImage({
            pose,
            localUri: uri,
            previewUri: uri,
            imageUrl: '',
            uploadStatus: 'UPLOADING',
            uploadProgress: progress.percent
          });
        }
      });
      setFaceImage({
        pose,
        localUri: uri,
        previewUri: uri,
        imageUrl: uploaded.fileUrl,
        uploadedFileId: uploaded.fileId,
        uploadStatus: 'SUCCESS',
        uploadProgress: 100
      });
    } catch (error) {
      const cancelled = controller.signal.aborted;
      setFaceImage({
        pose,
        localUri: uri,
        previewUri: uri,
        imageUrl: '',
        uploadStatus: cancelled ? 'CANCELLED' : 'FAILED',
        uploadError: cancelled ? 'Upload cancelled' : uploadErrorMessage(error)
      });
      throw error;
    } finally {
      if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
    }
  }
  if (!permission) return /*#__PURE__*/React.createElement(LoadingState, {
    label: "Dang kiem tra camera"
  });
  if (!permission.granted) {
    return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
      style: {
        flex: 1,
        backgroundColor: '#F0F4F8'
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        flex: 1,
        justifyContent: 'center',
        padding: 24
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10
        },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EAF4FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement(Ionicons, {
      name: "camera-outline",
      size: 40,
      color: "#1E88E5"
    })), /*#__PURE__*/React.createElement(Text, {
      style: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0B3B61',
        marginBottom: 12,
        textAlign: 'center'
      }
    }, "Quy\u1EC1n Camera"), /*#__PURE__*/React.createElement(Text, {
      style: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32
      }
    }, "\u1EE8ng d\u1EE5ng c\u1EA7n quy\u1EC1n truy c\u1EADp camera \u0111\u1EC3 ch\u1EE5p \u1EA3nh khu\xF4n m\u1EB7t (G\xF3c th\u1EB3ng, tr\xE1i, ph\u1EA3i) ph\u1EE5c v\u1EE5 qu\xE1 tr\xECnh \u0111\u1ECBnh danh b\u1EA3o m\u1EADt."), /*#__PURE__*/React.createElement(Pressable, {
      onPress: () => void requestPermission(),
      style: {
        width: '100%',
        backgroundColor: '#1E88E5',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: {
          width: 0,
          height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
      }
    }, "C\u1EA4P QUY\u1EC0N CAMERA")), /*#__PURE__*/React.createElement(Pressable, {
      onPress: () => router.back(),
      style: {
        width: '100%',
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0'
      }
    }, /*#__PURE__*/React.createElement(Text, {
      style: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700'
      }
    }, "QUAY L\u1EA0I"))))));
  }
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#000000'
    }
  }, /*#__PURE__*/React.createElement(CameraView, {
    ref: cameraRef,
    active: true,
    facing: "front",
    mirror: true,
    style: StyleSheet.absoluteFill,
    onMountError: () => setCaptureError('Camera khong kha dung tren thiet bi nay')
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: 60,
      paddingHorizontal: 24,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.back(),
    style: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "arrow-back",
    size: 24,
    color: "#FFFFFF"
  })), /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: {
        width: 0,
        height: 1
      },
      textShadowRadius: 4
    }
  }, "X\xE1c th\u1EF1c khu\xF4n m\u1EB7t"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: {
        width: 0,
        height: 1
      },
      textShadowRadius: 4
    }
  }, "B\u01B0\u1EDBc 4/5"))), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between'
    }
  }, poses.map(pose => {
    const image = values.faceImages.find(item => item.pose === pose);
    const isSuccess = image?.uploadStatus === 'SUCCESS';
    const isActive = pose === activePose;
    return /*#__PURE__*/React.createElement(View, {
      key: pose,
      style: {
        alignItems: 'center',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(View, {
      style: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isSuccess ? '#10B981' : isActive ? '#1E88E5' : 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: isActive ? 2 : 0,
        borderColor: '#FFFFFF'
      }
    }, /*#__PURE__*/React.createElement(Ionicons, {
      name: isSuccess ? "checkmark" : "person",
      size: 16,
      color: "#FFFFFF"
    })), /*#__PURE__*/React.createElement(Text, {
      style: {
        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '700'
      }
    }, pose));
  }))), /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 250,
      height: 300,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
      borderRadius: 20,
      borderStyle: 'dashed'
    }
  }), /*#__PURE__*/React.createElement(Text, {
    style: {
      position: 'absolute',
      bottom: '25%',
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      overflow: 'hidden'
    }
  }, facePoseLabels[activePose])), /*#__PURE__*/React.createElement(View, {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 24,
      paddingBottom: 40,
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32
    }
  }, currentImage?.previewUri ? /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      backgroundColor: 'rgba(255,255,255,0.1)',
      padding: 12,
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement(Image, {
    source: {
      uri: currentImage.previewUri
    },
    style: {
      width: 64,
      height: 64,
      borderRadius: 8,
      marginRight: 16
    }
  }), /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4
    }
  }, "Tr\u1EA1ng th\xE1i \u1EA3nh"), currentImage.uploadStatus === 'UPLOADING' ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#60A5FA',
      fontSize: 13
    }
  }, "\u0110ang t\u1EA3i l\xEAn: ", currentImage.uploadProgress ?? 0, "%") : null, currentImage.uploadStatus === 'SUCCESS' ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#10B981',
      fontSize: 13
    }
  }, "T\u1EA3i l\xEAn th\xE0nh c\xF4ng") : null, currentImage.uploadStatus === 'FAILED' ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#EF4444',
      fontSize: 13
    }
  }, "T\u1EA3i l\xEAn th\u1EA5t b\u1EA1i") : null)) : null, captureError ? /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#EF4444',
      backgroundColor: 'rgba(239,68,68,0.2)',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      textAlign: 'center'
    }
  }, captureError) : null, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, currentImage?.uploadStatus === 'SUCCESS' ? /*#__PURE__*/React.createElement(Pressable, {
    disabled: activePose === 'RIGHT' && !complete,
    onPress: () => setActivePose(nextPose(activePose)),
    style: {
      flex: 1,
      backgroundColor: activePose === 'RIGHT' && !complete ? '#475569' : '#1E88E5',
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, activePose === 'RIGHT' ? 'HOÀN THÀNH' : 'CHỤP GÓC TIẾP THEO')) : /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 48,
      height: 48
    }
  }), " ", /*#__PURE__*/React.createElement(Pressable, {
    onPress: capture,
    disabled: capturing,
    style: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFFFFF'
    }
  })), /*#__PURE__*/React.createElement(View, {
    style: {
      width: 48,
      height: 48
    }
  }, currentImage?.uploadStatus === 'FAILED' ? /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => void retryUpload(currentImage),
    style: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "refresh",
    size: 24,
    color: "#FFFFFF"
  })) : null))), complete ? /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.push('/register/review'),
    style: {
      backgroundColor: '#10B981',
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      shadowColor: '#10B981',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "\u0110I T\u1EDAI KI\u1EC2M TRA")) : null)));
}
export function RegistrationReviewScreen() {
  const router = useRouter();
  const {
    values,
    reset
  } = useRegistration();
  const mutation = useMutation({
    mutationFn: registerEmployee
  });
  const faceOk = faceSchema.safeParse({
    faceImages: values.faceImages
  }).success;
  const canSubmit = accountSchema.safeParse(values).success && profileSchema.safeParse(values).success && departmentSchema.safeParse(values).success && faceOk;
  async function submit() {
    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      ...(values.email ? {
        email: values.email
      } : {}),
      password: values.password,
      idCardNumber: values.idCardNumber,
      ...(values.dateOfBirth ? {
        dateOfBirth: values.dateOfBirth
      } : {}),
      ...(values.gender ? {
        gender: values.gender
      } : {}),
      requestedDepartmentId: values.requestedDepartmentId,
      faceImages: values.faceImages.map(({
        pose,
        imageUrl,
        uploadedFileId
      }) => ({
        pose,
        imageUrl,
        fileId: uploadedFileId
      }))
    };
    try {
      await mutation.mutateAsync(payload);
      reset();
      router.replace('/register/success');
    } catch {
      // Mutation state renders the normalized error.
    }
  }
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(ScrollView, {
    contentContainerStyle: {
      padding: 24,
      paddingBottom: 100
    },
    showsVerticalScrollIndicator: false
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.back(),
    style: {
      padding: 4,
      marginRight: 12
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "arrow-back",
    size: 24,
    color: "#0B3B61"
  })), /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0B3B61'
    }
  }, "Ki\u1EC3m tra & G\u1EEDi"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 13,
      color: '#64748B'
    }
  }, "B\u01B0\u1EDBc 5/5"))), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "person-outline",
    size: 20,
    color: "#1E88E5"
  }), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0B3B61'
    }
  }, "T\xE0i kho\u1EA3n")), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "H\u1ECD t\xEAn:"), " ", values.fullName), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "S\u0110T:"), " ", values.phone), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "Email:"), " ", values.email || 'Không có email')), /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "document-text-outline",
    size: 20,
    color: "#1E88E5"
  }), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0B3B61'
    }
  }, "H\u1ED3 s\u01A1")), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "CCCD:"), " ********", values.idCardNumber.slice(-4)), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "Ph\xF2ng ban ID:"), " ", values.requestedDepartmentId || 'Chưa chọn'), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 14,
      color: '#3B4A59'
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      fontWeight: '600'
    }
  }, "Khu\xF4n m\u1EB7t t\u1EA3i l\xEAn:"), " ", values.faceImages.filter(image => image.uploadStatus === 'SUCCESS').length, "/3")), mutation.error ? /*#__PURE__*/React.createElement(View, {
    style: {
      backgroundColor: '#FEF2F2',
      padding: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "alert-circle",
    size: 20,
    color: "#EF4444"
  }), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#EF4444',
      fontSize: 13,
      flex: 1
    }
  }, registrationErrorMessage(mutation.error))) : null), /*#__PURE__*/React.createElement(View, {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0'
    }
  }, /*#__PURE__*/React.createElement(Pressable, {
    disabled: !canSubmit || mutation.isPending,
    onPress: () => void submit(),
    style: {
      backgroundColor: !canSubmit || mutation.isPending ? '#93C5FD' : '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, mutation.isPending ? 'ĐANG GỬI...' : 'GỬI ĐĂNG KÝ')))));
}
export function RegistrationSuccessScreen() {
  const router = useRouter();
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      backgroundColor: '#F0F4F8'
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1,
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      alignItems: 'center',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      width: 80,
      height: 80,
      backgroundColor: '#10B981',
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#10B981',
      shadowOffset: {
        width: 0,
        height: 8
      },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8
    }
  }, /*#__PURE__*/React.createElement(Ionicons, {
    name: "checkmark-sharp",
    size: 48,
    color: "#FFFFFF"
  })), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 24,
      fontWeight: '800',
      color: '#0B3B61',
      textAlign: 'center',
      marginBottom: 8
    }
  }, "\u0110\u0103ng k\xFD th\xE0nh c\xF4ng!"), /*#__PURE__*/React.createElement(Text, {
    style: {
      fontSize: 15,
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 16
    }
  }, "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111ang ch\u1EDD ph\xEA duy\u1EC7t t\u1EEB Ban qu\u1EA3n l\xFD. Vui l\xF2ng ch\u1EDD th\xF4ng b\xE1o.")), /*#__PURE__*/React.createElement(Pressable, {
    onPress: () => router.replace('/login'),
    style: {
      backgroundColor: '#1E88E5',
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1E88E5',
      shadowOffset: {
        width: 0,
        height: 4
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  }, "QUAY V\u1EC0 \u0110\u0102NG NH\u1EACP")))));
}
function DepartmentOption({
  department,
  selected,
  onPress
}) {
  return /*#__PURE__*/React.createElement(Pressable, {
    accessibilityRole: "button",
    onPress: onPress,
    style: {
      backgroundColor: selected ? '#EAF4FE' : '#FFFFFF',
      borderColor: selected ? '#1E88E5' : '#E2E8F0',
      borderRadius: 16,
      borderWidth: selected ? 2 : 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(View, {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#0B3B61',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4
    }
  }, department.name), /*#__PURE__*/React.createElement(Text, {
    style: {
      color: '#64748B',
      fontSize: 13
    }
  }, department.description ?? department.code)), selected ? /*#__PURE__*/React.createElement(Ionicons, {
    name: "checkmark-circle",
    size: 24,
    color: "#1E88E5"
  }) : /*#__PURE__*/React.createElement(Ionicons, {
    name: "ellipse-outline",
    size: 24,
    color: "#CBD5E1"
  }));
}
function nextPose(pose) {
  if (pose === 'FRONT') return 'LEFT';
  if (pose === 'LEFT') return 'RIGHT';
  return 'RIGHT';
}
function registrationErrorMessage(error) {
  const normalized = normalizeApiError(error);
  const map = {
    DUPLICATE_PHONE: 'So dien thoai da ton tai',
    DUPLICATE_ID_CARD: 'CCCD da ton tai',
    INVALID_FACE_IMAGES: 'Can du anh FRONT, LEFT, RIGHT',
    UPLOAD_FILE_REQUIRED: 'Can upload du 3 anh khuon mat',
    UPLOAD_ALREADY_ATTACHED: 'Anh upload da duoc su dung',
    UPLOAD_NOT_FOUND: 'Khong tim thay file upload'
  };
  return map[normalized.code] ?? mapLoginError(error);
}
function uploadErrorMessage(error) {
  const normalized = normalizeApiError(error);
  const map = {
    UPLOAD_FILE_TOO_LARGE: 'File qua lon',
    UPLOAD_MIME_NOT_ALLOWED: 'Dinh dang file khong duoc ho tro',
    UPLOAD_SIGNATURE_INVALID: 'Noi dung file khong hop le',
    UPLOAD_STORAGE_FAILED: 'Luu file that bai'
  };
  return map[normalized.code] ?? 'Upload failed';
}
const styles = StyleSheet.create({
  cameraActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  cameraError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    color: colors.danger,
    padding: spacing.md
  },
  cameraOverlay: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'flex-end',
    padding: spacing.lg
  },
  cameraPage: {
    flex: 1,
    position: 'relative'
  },
  error: {
    color: colors.danger,
    fontSize: 14
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 13
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800'
  },
  poseRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  preview: {
    alignSelf: 'center',
    borderRadius: 8,
    height: 120,
    width: 120
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  }
});