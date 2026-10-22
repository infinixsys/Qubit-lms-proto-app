package com.qubitsolutions.lms;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
@CapacitorPlugin(name="SecureSession")
public class SecureSessionPlugin extends Plugin {
 private SecretKey key() throws Exception {
  KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
  if(!store.containsAlias("qubit-session")){KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder("qubit-session",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());g.generateKey();}
  return (SecretKey)store.getKey("qubit-session",null);
 }
 @PluginMethod public void set(PluginCall call){try{String value=call.getString("value");if(value==null)throw new Exception("Missing session");Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());String saved=Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(c.doFinal(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)),Base64.NO_WRAP);getContext().getSharedPreferences("qubit-secure",0).edit().putString("session",saved).commit();call.resolve();}catch(Exception e){call.reject("Unable to save session securely");}}
 @PluginMethod public void get(PluginCall call){try{String value=getContext().getSharedPreferences("qubit-secure",0).getString("session",null);JSObject result=new JSObject();if(value!=null){String[] parts=value.split(":");Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));result.put("value",new String(c.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),java.nio.charset.StandardCharsets.UTF_8));}call.resolve(result);}catch(Exception e){getContext().getSharedPreferences("qubit-secure",0).edit().clear().commit();call.resolve(new JSObject());}}
 @PluginMethod public void clear(PluginCall call){getContext().getSharedPreferences("qubit-secure",0).edit().clear().commit();call.resolve();}
}
