/* Generated by Nim Compiler v0.19.1 */
/*   (c) 2018 Andreas Rumpf */
/* The generated code is subject to the original license. */
#define NIM_NEW_MANGLING_RULES
#define NIM_INTBITS 64

#include "nimbase.h"
#include <string.h>
#undef LANGUAGE_C
#undef MIPSEB
#undef MIPSEL
#undef PPC
#undef R3000
#undef R4000
#undef i386
#undef linux
#undef mips
#undef near
#undef far
#undef powerpc
#undef unix
struct tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA;
struct NimStringDesc;
struct TGenericSeq;
struct tySequence_sM4lkSb7zS6F7OVMvW9cffQ;
struct tyTuple_lefO4c7uh3Xx9aVq7AgmwHw;
struct tySequence_phjbYJtsbOIAYa9be34hhZg;
struct TNimType;
struct TNimNode;
struct tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw;
struct tyObject_DbError_9cp8FUMATyqFmLaAKCXEjCQ;
struct tyObject_IOError_iLZrPn9anoh9ad1MmO0RczFw;
struct tyObject_CatchableError_qrLSDoe2oBoAqNtJ9badtnA;
struct Exception;
struct RootObj;
struct tySequence_uB9b75OUPRENsBAu4AnoePA;
struct tyTuple_KgCfVHUs0cYxgmkyevnAYA;
struct tyObject_StackTraceEntry_oLyohQ7O2XOvGnflOss8EA;
struct TGenericSeq {
NI len;
NI reserved;
};
typedef NIM_CHAR tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ[1];
struct NimStringDesc : public TGenericSeq {
tyUncheckedArray_py3s8sMDoAoBkn8uuh0ZzQ data;
};
struct tyTuple_lefO4c7uh3Xx9aVq7AgmwHw {
tySequence_phjbYJtsbOIAYa9be34hhZg* Field0;
NimStringDesc* Field1;
};
typedef NU8 tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A;
typedef NU8 tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ;
typedef N_NIMCALL_PTR(void, tyProc_ojoeKfW4VYIm36I9cpDTQIg) (void* p, NI op);
typedef N_NIMCALL_PTR(void*, tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ) (void* p);
struct TNimType {
NI size;
tyEnum_TNimKind_jIBKr1ejBgsfM33Kxw4j7A kind;
tySet_tyEnum_TNimTypeFlag_v8QUszD1sWlSIWZz7mC4bQ flags;
TNimType* base;
TNimNode* node;
void* finalizer;
tyProc_ojoeKfW4VYIm36I9cpDTQIg marker;
tyProc_WSm2xU5ARYv9aAR4l0z9c9auQ deepcopy;
};
typedef NU8 tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ;
struct TNimNode {
tyEnum_TNimNodeKind_unfNsxrcATrufDZmpBq4HQ kind;
NI offset;
TNimType* typ;
NCSTRING name;
NI len;
TNimNode** sons;
};
struct RootObj {
TNimType* m_type;
};
N_NIMCALL(void, popCurrentExceptionEx)(NU id);struct Exception : public RootObj {
virtual void raise() {throw *this;}
~Exception() {if(this->raise_id) popCurrentExceptionEx(this->raise_id);}
Exception* parent;
NCSTRING name;
NimStringDesc* message;
tySequence_uB9b75OUPRENsBAu4AnoePA* trace;
NU raise_id;
Exception* up;
};
struct tyObject_CatchableError_qrLSDoe2oBoAqNtJ9badtnA : public Exception {
virtual void raise() {throw *this;}
};
struct tyObject_IOError_iLZrPn9anoh9ad1MmO0RczFw : public tyObject_CatchableError_qrLSDoe2oBoAqNtJ9badtnA {
virtual void raise() {throw *this;}
};
struct tyObject_DbError_9cp8FUMATyqFmLaAKCXEjCQ : public tyObject_IOError_iLZrPn9anoh9ad1MmO0RczFw {
virtual void raise() {throw *this;}
};
struct tyTuple_KgCfVHUs0cYxgmkyevnAYA {
NI64 Field0;
NimStringDesc* Field1;
};
typedef NimStringDesc* tyArray_8ZvwQIddfpj2THRVPsFzIQ[1];
struct tyObject_StackTraceEntry_oLyohQ7O2XOvGnflOss8EA {
NCSTRING procname;
NI line;
NCSTRING filename;
};
struct tySequence_sM4lkSb7zS6F7OVMvW9cffQ : TGenericSeq {
  NimStringDesc* data[SEQ_DECL_SIZE];
};
struct tySequence_phjbYJtsbOIAYa9be34hhZg : TGenericSeq {
  tySequence_sM4lkSb7zS6F7OVMvW9cffQ* data[SEQ_DECL_SIZE];
};
struct tySequence_uB9b75OUPRENsBAu4AnoePA : TGenericSeq {
  tyObject_StackTraceEntry_oLyohQ7O2XOvGnflOss8EA data[SEQ_DECL_SIZE];
};
N_NIMCALL(void, nimGCvisit)(void* d, NI op);
static N_NIMCALL(void, Marker_tySequence_phjbYJtsbOIAYa9be34hhZg)(void* p, NI op);
N_NIMCALL(void, genericReset)(void* dest, TNimType* mt);
N_NIMCALL(void, popCurrentExceptionEx)(NU id);
N_LIB_PRIVATE N_NIMCALL(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw*, setupQuery_6EQAJlzQgp6Lnc8upW20sQ)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc* query, NimStringDesc** args, NI argsLen_0);
extern "C" N_CDECL(NI32, sqlite3_column_count)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* pStmt);
N_LIB_PRIVATE N_NIMCALL(tySequence_sM4lkSb7zS6F7OVMvW9cffQ*, newRow_yziwAL431pdzkjLvusuw3Q)(NI L);
extern "C" N_CDECL(NI32, sqlite3_step)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* para1);
N_LIB_PRIVATE N_NIMCALL(void, setRow_i9caC20eiZfH0Cu9czRpxoPQ)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* stmt, tySequence_sM4lkSb7zS6F7OVMvW9cffQ*& r, int cols);
N_NIMCALL(TGenericSeq*, incrSeqV3)(TGenericSeq* s, TNimType* typ);
N_NIMCALL(void, unsureAsgnRef)(void** dest, void* src);
N_NIMCALL(void, genericSeqAssign)(void* dest, void* src, TNimType* mt);
extern "C" N_CDECL(NI32, sqlite3_finalize)(tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* pStmt);
N_LIB_PRIVATE N_NIMCALL(void, dbError_yRzNipQFOsKqLVySy7Je9bw)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db) __attribute__((noreturn));
static N_INLINE(NimStringDesc*, getCurrentExceptionMsg_fOe1OXzHoGbgrd7IEmbp5Qbudgetfile)(void);
static N_INLINE(Exception*, getCurrentException)(void);
N_NIMCALL(NimStringDesc*, copyString)(NimStringDesc* src);
N_LIB_PRIVATE N_NIMCALL(void, exec_kASFnJjvwTJpKpmn9aQHmPg)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc* query, NimStringDesc** args, NI argsLen_0);
extern "C" N_CDECL(NI64, sqlite3_last_insert_rowid)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* para1);
static N_INLINE(void, nimZeroMem)(void* p, NI size);
static N_INLINE(void, nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem)(void* a, int v, NI size);
TNimType NTI_lefO4c7uh3Xx9aVq7AgmwHw_;
extern TNimType NTI_sM4lkSb7zS6F7OVMvW9cffQ_;
TNimType NTI_phjbYJtsbOIAYa9be34hhZg_;
extern TNimType NTI_77mFvmsOLKik79ci2hXkHEg_;
extern Exception* currException_9bVPeDJlYTi9bQApZpfH8wjg;
TNimType NTI_KgCfVHUs0cYxgmkyevnAYA_;
extern TNimType NTI_Aav8dQoMlCFnZRxA0IhTHQ_;
static N_NIMCALL(void, Marker_tySequence_phjbYJtsbOIAYa9be34hhZg)(void* p, NI op) {
	tySequence_phjbYJtsbOIAYa9be34hhZg* a;
	NI T1_;
	a = (tySequence_phjbYJtsbOIAYa9be34hhZg*)p;
	T1_ = (NI)0;
	for (T1_ = 0; T1_ < (a ? a->len : 0); T1_++) {
	nimGCvisit((void*)a->data[T1_], op);
	}
}

static N_INLINE(Exception*, getCurrentException)(void) {
	Exception* result;
	result = (Exception*)0;
	result = currException_9bVPeDJlYTi9bQApZpfH8wjg;
	return result;
}

static N_INLINE(NimStringDesc*, getCurrentExceptionMsg_fOe1OXzHoGbgrd7IEmbp5Qbudgetfile)(void) {
	NimStringDesc* result;
{	result = (NimStringDesc*)0;
	Exception* e = getCurrentException();
	{
		if (!(e == NIM_NIL)) goto LA3_;
{		result = ((NimStringDesc*) NIM_NIL);
}	}
	goto LA1_;
	LA3_: ;
	{
		result = copyString((*e).message);
	}
	LA1_: ;
	goto BeforeRet_;
	}BeforeRet_: ;
	return result;
}

N_LIB_PRIVATE N_NIMCALL(void, fetchAll_NZYxirScLHXR9b9bx75hx9a8w)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc* statement, tySequence_sM4lkSb7zS6F7OVMvW9cffQ* params, tyTuple_lefO4c7uh3Xx9aVq7AgmwHw* Result) {
	genericReset((void*)Result, (&NTI_lefO4c7uh3Xx9aVq7AgmwHw_));
	try {
		{
			tySequence_sM4lkSb7zS6F7OVMvW9cffQ* x;
			tySequence_sM4lkSb7zS6F7OVMvW9cffQ* result_2;
			x = (tySequence_sM4lkSb7zS6F7OVMvW9cffQ*)0;
			tyObject_Tstmt_KEhcjAECDwKIYLLjIzakvw* stmt = setupQuery_6EQAJlzQgp6Lnc8upW20sQ(db, statement, params->data, (params ? params->len : 0));
			NI32 L = sqlite3_column_count(stmt);
			result_2 = newRow_yziwAL431pdzkjLvusuw3Q(((NI) (L)));
			{
				while (1) {
					NI32 T5_;
					NI T6_;
					T5_ = (NI32)0;
					T5_ = sqlite3_step(stmt);
					if (!(T5_ == ((NI32) 100))) goto LA4;
					setRow_i9caC20eiZfH0Cu9czRpxoPQ(stmt, result_2, L);
					x = result_2;
					unsureAsgnRef((void**) (&(*Result).Field0), (tySequence_phjbYJtsbOIAYa9be34hhZg*) incrSeqV3((*Result).Field0, (&NTI_phjbYJtsbOIAYa9be34hhZg_)));
					T6_ = (*Result).Field0->len++;
					genericSeqAssign((&(*Result).Field0->data[T6_]), x, (&NTI_sM4lkSb7zS6F7OVMvW9cffQ_));
				} LA4: ;
			}
			{
				NI32 T9_;
				T9_ = (NI32)0;
				T9_ = sqlite3_finalize(stmt);
				if (!!((T9_ == ((NI32) 0)))) goto LA10_;
{				dbError_yRzNipQFOsKqLVySy7Je9bw(db);
}			}
			LA10_: ;
		}
	}
	catch (tyObject_DbError_9cp8FUMATyqFmLaAKCXEjCQ&) {
		unsureAsgnRef((void**) (&(*Result).Field1), getCurrentExceptionMsg_fOe1OXzHoGbgrd7IEmbp5Qbudgetfile());
	}
}

N_LIB_PRIVATE N_NIMCALL(void, runQuery_R9aImShHkr9aB5aLN15q9b30Q)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc* statement, tySequence_sM4lkSb7zS6F7OVMvW9cffQ* params, tyTuple_KgCfVHUs0cYxgmkyevnAYA* Result) {
	genericReset((void*)Result, (&NTI_KgCfVHUs0cYxgmkyevnAYA_));
	try {
		exec_kASFnJjvwTJpKpmn9aQHmPg(db, statement, params->data, (params ? params->len : 0));
		(*Result).Field0 = sqlite3_last_insert_rowid(db);
	}
	catch (tyObject_DbError_9cp8FUMATyqFmLaAKCXEjCQ&) {
		unsureAsgnRef((void**) (&(*Result).Field1), getCurrentExceptionMsg_fOe1OXzHoGbgrd7IEmbp5Qbudgetfile());
	}
}

static N_INLINE(void, nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem)(void* a, int v, NI size) {
	void* T1_;
	T1_ = (void*)0;
	T1_ = memset(a, v, ((size_t) (size)));
}

static N_INLINE(void, nimZeroMem)(void* p, NI size) {
	nimSetMem_cNwQQ4PlSJsZSwvoN5Uafwsystem(p, ((int) 0), size);
}

N_LIB_PRIVATE N_NIMCALL(NimStringDesc*, executeMany_QzcBlAz6q9anBvlQTdYUQiA)(tyObject_Sqlite3_xRZkbCqVWSKf8kX4o9cbKXA* db, NimStringDesc** statements, NI statementsLen_0) {
	NimStringDesc* result;
	result = (NimStringDesc*)0;
	try {
		{
			NimStringDesc* s;
			s = (NimStringDesc*)0;
			NI i = ((NI) 0);
			{
				while (1) {
					tyArray_8ZvwQIddfpj2THRVPsFzIQ T5_;
					if (!(i < statementsLen_0)) goto LA4;
					s = statements[i];
					nimZeroMem((void*)T5_, sizeof(tyArray_8ZvwQIddfpj2THRVPsFzIQ));
					exec_kASFnJjvwTJpKpmn9aQHmPg(db, s, T5_, 0);
					i += ((NI) 1);
				} LA4: ;
			}
		}
	}
	catch (tyObject_DbError_9cp8FUMATyqFmLaAKCXEjCQ&) {
		result = getCurrentExceptionMsg_fOe1OXzHoGbgrd7IEmbp5Qbudgetfile();
	}
	return result;
}
N_LIB_PRIVATE N_NIMCALL(void, buckets_dbInit000)(void) {
{
	TFrame FR_; FR_.len = 0;
}
}

N_LIB_PRIVATE N_NIMCALL(void, buckets_dbDatInit000)(void) {
static TNimNode* TM_GsqUuOaHBzpx3PWGFQW5yg_2[2];
static TNimNode* TM_GsqUuOaHBzpx3PWGFQW5yg_3[2];
static TNimNode TM_GsqUuOaHBzpx3PWGFQW5yg_0[6];
NTI_lefO4c7uh3Xx9aVq7AgmwHw_.size = sizeof(tyTuple_lefO4c7uh3Xx9aVq7AgmwHw);
NTI_lefO4c7uh3Xx9aVq7AgmwHw_.kind = 18;
NTI_lefO4c7uh3Xx9aVq7AgmwHw_.base = 0;
NTI_lefO4c7uh3Xx9aVq7AgmwHw_.flags = 2;
TM_GsqUuOaHBzpx3PWGFQW5yg_2[0] = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[1];
NTI_phjbYJtsbOIAYa9be34hhZg_.size = sizeof(tySequence_phjbYJtsbOIAYa9be34hhZg*);
NTI_phjbYJtsbOIAYa9be34hhZg_.kind = 24;
NTI_phjbYJtsbOIAYa9be34hhZg_.base = (&NTI_sM4lkSb7zS6F7OVMvW9cffQ_);
NTI_phjbYJtsbOIAYa9be34hhZg_.flags = 2;
NTI_phjbYJtsbOIAYa9be34hhZg_.marker = Marker_tySequence_phjbYJtsbOIAYa9be34hhZg;
TM_GsqUuOaHBzpx3PWGFQW5yg_0[1].kind = 1;
TM_GsqUuOaHBzpx3PWGFQW5yg_0[1].offset = offsetof(tyTuple_lefO4c7uh3Xx9aVq7AgmwHw, Field0);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[1].typ = (&NTI_phjbYJtsbOIAYa9be34hhZg_);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[1].name = "Field0";
TM_GsqUuOaHBzpx3PWGFQW5yg_2[1] = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[2];
TM_GsqUuOaHBzpx3PWGFQW5yg_0[2].kind = 1;
TM_GsqUuOaHBzpx3PWGFQW5yg_0[2].offset = offsetof(tyTuple_lefO4c7uh3Xx9aVq7AgmwHw, Field1);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[2].typ = (&NTI_77mFvmsOLKik79ci2hXkHEg_);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[2].name = "Field1";
TM_GsqUuOaHBzpx3PWGFQW5yg_0[0].len = 2; TM_GsqUuOaHBzpx3PWGFQW5yg_0[0].kind = 2; TM_GsqUuOaHBzpx3PWGFQW5yg_0[0].sons = &TM_GsqUuOaHBzpx3PWGFQW5yg_2[0];
NTI_lefO4c7uh3Xx9aVq7AgmwHw_.node = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[0];
NTI_KgCfVHUs0cYxgmkyevnAYA_.size = sizeof(tyTuple_KgCfVHUs0cYxgmkyevnAYA);
NTI_KgCfVHUs0cYxgmkyevnAYA_.kind = 18;
NTI_KgCfVHUs0cYxgmkyevnAYA_.base = 0;
NTI_KgCfVHUs0cYxgmkyevnAYA_.flags = 2;
TM_GsqUuOaHBzpx3PWGFQW5yg_3[0] = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[4];
TM_GsqUuOaHBzpx3PWGFQW5yg_0[4].kind = 1;
TM_GsqUuOaHBzpx3PWGFQW5yg_0[4].offset = offsetof(tyTuple_KgCfVHUs0cYxgmkyevnAYA, Field0);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[4].typ = (&NTI_Aav8dQoMlCFnZRxA0IhTHQ_);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[4].name = "Field0";
TM_GsqUuOaHBzpx3PWGFQW5yg_3[1] = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[5];
TM_GsqUuOaHBzpx3PWGFQW5yg_0[5].kind = 1;
TM_GsqUuOaHBzpx3PWGFQW5yg_0[5].offset = offsetof(tyTuple_KgCfVHUs0cYxgmkyevnAYA, Field1);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[5].typ = (&NTI_77mFvmsOLKik79ci2hXkHEg_);
TM_GsqUuOaHBzpx3PWGFQW5yg_0[5].name = "Field1";
TM_GsqUuOaHBzpx3PWGFQW5yg_0[3].len = 2; TM_GsqUuOaHBzpx3PWGFQW5yg_0[3].kind = 2; TM_GsqUuOaHBzpx3PWGFQW5yg_0[3].sons = &TM_GsqUuOaHBzpx3PWGFQW5yg_3[0];
NTI_KgCfVHUs0cYxgmkyevnAYA_.node = &TM_GsqUuOaHBzpx3PWGFQW5yg_0[3];
}

